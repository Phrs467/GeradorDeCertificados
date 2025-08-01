import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { firestore } from "@/lib/firebase";
import { collection, addDoc, query, where, getDocs, doc, updateDoc } from "firebase/firestore";

export async function POST(req: NextRequest) {
  // Detecta se é JSON ou FormData
  const contentType = req.headers.get('content-type') || '';
  
  // Verifica se está no modo correção
  const modoCorrecao = req.headers.get('x-correcao') === 'true';
  console.log('🔧 Modo correção:', modoCorrecao);

  if (contentType.includes('application/json')) {
    // Recebe um único certificado como JSON
    const data = await req.json();
    
    // Primeiro, verifica se o certificado já existe em qualquer aluno (pelo ID)
    console.log('Verificando se certificado já existe no banco (ID:', data.id, ')');
    const todosAlunosRef = collection(firestore, "alunos");
    const todosAlunosSnap = await getDocs(todosAlunosRef);
    let certificadoJaExiste = false;
    let alunoExistente: any = null;
    let certificadoExistente: any = null;
    
    todosAlunosSnap.forEach(docSnap => {
      const alunoData = docSnap.data();
      const certificados = Array.isArray(alunoData.certificados) ? alunoData.certificados : [];
      const encontrado = certificados.find((c: any) => String(c.id) === String(data.id));
      if (encontrado) {
        certificadoJaExiste = true;
        alunoExistente = { doc: docSnap, data: alunoData };
        certificadoExistente = encontrado;
        console.log('Certificado já existe no banco. ID:', data.id, 'Aluno:', alunoData.nome);
      }
    });
    
    // Se está no modo correção e o certificado existe, será tratado na lógica mais completa abaixo
    if (certificadoJaExiste && modoCorrecao) {
      console.log('🔧 Modo correção: Certificado encontrado, será processado na lógica completa');
    }
    
    // Se não está no modo correção e o certificado já existe, retorna que existe
    if (certificadoJaExiste && !modoCorrecao) {
      return NextResponse.json({ 
        success: true, 
        exists: true, 
        message: "Certificado já existe no banco de dados" 
      });
    }
    
    console.log('Certificado não existe no banco, prosseguindo...');
    
    // Busca aluno por nome+documento (apenas se não estiver no modo correção)
    const alunosRef = collection(firestore, "alunos");
    let querySnapshot;
    
    if (modoCorrecao) {
      // No modo correção, busca o aluno que contém o certificado com o ID especificado
      console.log('🔧 Modo correção: Buscando aluno que contém o certificado com ID:', data.id);
      const todosAlunosSnap = await getDocs(alunosRef);
      let alunoEncontrado: { doc: any; data: any } | null = null;
      
      todosAlunosSnap.forEach(docSnap => {
        const alunoData = docSnap.data();
        const certificados = Array.isArray(alunoData.certificados) ? alunoData.certificados : [];
        const certificadoExiste = certificados.some((c: any) => String(c.id) === String(data.id));
        if (certificadoExiste) {
          alunoEncontrado = { doc: docSnap, data: alunoData };
          console.log('🔍 Encontrou aluno com certificado:', alunoData.nome, 'ID do certificado:', data.id);
        }
      });
      
      if (alunoEncontrado) {
        console.log('🔧 Modo correção: Aluno encontrado, verificando mudanças');
        console.log('📝 Nome antigo:', alunoEncontrado.data.nome, 'Nome novo:', data.nome);
        console.log('📝 Documento antigo:', alunoEncontrado.data.documento, 'Documento novo:', data.documento);
        
        const certificados = Array.isArray(alunoEncontrado.data.certificados) ? alunoEncontrado.data.certificados : [];
        const index = certificados.findIndex((c: any) => String(c.id) === String(data.id));
        
        if (index !== -1) {
          const certificadoAtualizado = {
            cargaHoraria: data.cargahoraria || data.cargaHoraria || 0,
            dataConclusao: data.conclusao || data.dataConclusao || '',
            dataEmissao: data.dataemissao || data.dataEmissao || '',
            documento: data.documento || '',
            empresa: data.empresa || '',
            id: data.id || '',
            instrutor: data.instrutor || '',
            nome: data.nome || '',
            treinamento: data.treinamento || ''
          };
          
          // Verifica se o nome do aluno mudou
          const nomeMudou = alunoEncontrado.data.nome !== data.nome;
          const documentoMudou = alunoEncontrado.data.documento !== data.documento;
          
          console.log('🔍 Mudanças detectadas - Nome mudou:', nomeMudou, 'Documento mudou:', documentoMudou);
          
          if (nomeMudou || documentoMudou) {
            console.log('🔧 Modo correção: Nome ou documento mudou, movendo certificado para novo aluno');
            
            // Remove o certificado do aluno antigo
            certificados.splice(index, 1);
            await updateDoc(alunoEncontrado.doc.ref, { certificados });
            console.log('✅ Certificado removido do aluno antigo');
            
            // Verifica se existe um aluno com o novo nome/documento
            const qNovoAluno = query(alunosRef, where("nome", "==", data.nome), where("documento", "==", data.documento));
            const novoAlunoSnap = await getDocs(qNovoAluno);
            
            console.log('🔍 Verificando se existe aluno com novo nome/documento:', data.nome, data.documento);
            console.log('🔍 Resultado da busca:', novoAlunoSnap.empty ? 'Não encontrou' : 'Encontrou');
            
            if (!novoAlunoSnap.empty) {
              // Aluno com novo nome já existe, adiciona o certificado
              const novoAlunoDoc = novoAlunoSnap.docs[0];
              const novoAlunoData = novoAlunoDoc.data();
              const novosCertificados = Array.isArray(novoAlunoData.certificados) ? novoAlunoData.certificados : [];
              novosCertificados.push(certificadoAtualizado);
              await updateDoc(novoAlunoDoc.ref, { certificados: novosCertificados });
              console.log('✅ Certificado movido para aluno existente com novo nome');
              return NextResponse.json({ 
                success: true, 
                exists: false, 
                id: novoAlunoDoc.id,
                message: "Certificado movido para aluno com novo nome" 
              });
            } else {
              // Cria novo aluno com o novo nome
              console.log('🔧 Criando novo aluno com nome:', data.nome, 'documento:', data.documento);
              const novoAluno = {
                nome: data.nome || '',
                documento: data.documento || '',
                empresa: data.empresa || '',
                certificados: [certificadoAtualizado]
              };
              console.log('📝 Dados do novo aluno:', novoAluno);
              const docRef = await addDoc(alunosRef, novoAluno);
              console.log('✅ Novo aluno criado com ID:', docRef.id);
              return NextResponse.json({ 
                success: true, 
                exists: false, 
                id: docRef.id,
                message: "Novo aluno criado com certificado atualizado" 
              });
            }
          } else {
            // Nome não mudou, apenas atualiza o certificado
            certificados[index] = certificadoAtualizado;
            await updateDoc(alunoEncontrado.doc.ref, { certificados });
            console.log('✅ Certificado atualizado com sucesso no modo correção');
            return NextResponse.json({ 
              success: true, 
              exists: false, 
              id: alunoEncontrado.doc.id,
              message: "Certificado atualizado no modo correção" 
            });
          }
        } else {
          console.log('❌ Certificado não encontrado no array do aluno');
        }
      } else {
        console.log('🔧 Modo correção: Certificado não encontrado, criando novo');
      }
    } else {
      // Busca normal por nome+documento
      const q = query(alunosRef, where("nome", "==", data.nome), where("documento", "==", data.documento));
      querySnapshot = await getDocs(q);
    }
    
    const certificado = {
      cargaHoraria: data.cargahoraria || data.cargaHoraria || 0,
      dataConclusao: data.conclusao || data.dataConclusao || '',
      dataEmissao: data.dataemissao || data.dataEmissao || '',
      documento: data.documento || '',
      empresa: data.empresa || '',
      id: data.id || '',
      instrutor: data.instrutor || '',
      nome: data.nome || '',
      treinamento: data.treinamento || ''
    };
    
    // Se está no modo correção e não encontrou o certificado, cria novo aluno
    if (modoCorrecao) {
      console.log('🔧 Modo correção: Certificado não encontrado, criando novo aluno');
      const novoAluno = {
        nome: data.nome || '',
        documento: data.documento || '',
        empresa: data.empresa || '',
        certificados: [certificado]
      };
      console.log('📝 Criando novo aluno no modo correção:', novoAluno);
      const docRef = await addDoc(alunosRef, novoAluno);
      console.log('✅ Novo aluno criado no modo correção com ID:', docRef.id);
      return NextResponse.json({ 
        success: true, 
        exists: false, 
        id: docRef.id,
        message: "Novo aluno criado no modo correção" 
      });
    }
    
    if (!modoCorrecao && !querySnapshot!.empty) {
      // Aluno já existe, adiciona certificado ao array
      const alunoDoc = querySnapshot!.docs[0];
      const alunoData = alunoDoc.data();
      const certificados = Array.isArray(alunoData.certificados) ? alunoData.certificados : [];
      // Evita duplicidade de certificado pelo id
      if (!certificados.some((c: any) => c.id === certificado.id)) {
        certificados.push(certificado);
        await updateDoc(alunoDoc.ref, { certificados });
        return NextResponse.json({ success: true, id: alunoDoc.id, exists: false });
      } else {
        return NextResponse.json({ success: true, id: alunoDoc.id, exists: true });
      }
    }
    
    // Aluno não existe, cria novo documento
    const novoAluno = {
      nome: data.nome || '',
      documento: data.documento || '',
      empresa: data.empresa || '',
      certificados: [certificado]
    };
    console.log('Criando novo aluno:', novoAluno);
    const docRef = await addDoc(alunosRef, novoAluno);
    return NextResponse.json({ success: true, id: docRef.id, exists: false });
  }

  // Caso contrário, espera FormData (upload de planilha)
  const formData = await req.formData();
  const file = formData.get("file") as File;

  if (!file) {
    return NextResponse.json({ error: "Arquivo não enviado" }, { status: 400 });
  }

  // Lê o arquivo como ArrayBuffer
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  // Ignora a primeira linha e usa a segunda como cabeçalho
  const data = XLSX.utils.sheet_to_json(worksheet, { defval: '', raw: false, range: 1 });
  
  console.log('Planilha processada:', {
    totalLinhas: data.length,
    primeirasLinhas: data.slice(0, 3),
    colunas: Object.keys(data[0] || {})
  });
  
  console.log('=== INICIANDO PROCESSAMENTO DA PLANILHA ===');
  console.log('Total de linhas a processar:', data.length);

  // Para cada linha, verifica se existe e grava no Firestore
  const alunosRef = collection(firestore, "alunos");
  const results = [];
  const skipped = [];
  
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    console.log(`\n=== PROCESSANDO LINHA ${i + 1}/${data.length} ===`);
    console.log('Dados da linha:', row);
    
    const planilhaId = row["id"] || row["ID"] || "";
    
    if (!planilhaId) {
      console.log('❌ Pulando linha - ID vazio');
      skipped.push({ linha: row, motivo: "ID vazio" });
      continue;
    }
    
    const nome = row["aluno"] || row["ALUNO"] || "";
    const documento = String(row["documento"] || row["DOCUMENTO"] || "");
    
    if (!nome || !documento) {
      console.log('❌ Pulando linha - Nome ou documento vazio:', { nome, documento });
      skipped.push({ linha: row, motivo: "Nome ou documento vazio" });
      continue;
    }
    
    console.log('Verificando se certificado já existe no banco (ID:', planilhaId, ')');
    
    // Primeiro, verifica se o certificado já existe em qualquer aluno (pelo ID)
    const todosAlunosRef = collection(firestore, "alunos");
    const todosAlunosSnap = await getDocs(todosAlunosRef);
    let certificadoJaExiste = false;
    
    console.log('🔍 Verificando certificados existentes no banco...');
    todosAlunosSnap.forEach(docSnap => {
      const data = docSnap.data();
      const certificados = Array.isArray(data.certificados) ? data.certificados : [];
      console.log('👤 Verificando certificados do aluno:', data.nome, 'IDs:', certificados.map((c: any) => c.id));
      const encontrado = certificados.find((c: any) => String(c.id) === String(planilhaId));
      if (encontrado) {
        certificadoJaExiste = true;
        console.log('❌ Certificado já existe no banco, pulando. ID:', planilhaId, 'Aluno:', data.nome);
      }
    });
    
    if (certificadoJaExiste) {
      console.log('❌ Certificado já existe, pulando linha');
      skipped.push({ linha: row, motivo: "Certificado já existe no banco de dados", id: planilhaId });
      continue;
    }
    
    console.log('✅ Certificado não existe no banco, prosseguindo...');
    console.log('📋 Dados da linha:', {
      planilhaId,
      nome,
      documento,
      empresa: row["empresa"] || row["EMPRESA"] || '',
      treinamento: row["treinamento"] || row["TREINAMENTO"] || ''
    });
    console.log('🔍 Buscando aluno:', { nome, documento });
    
    // Busca aluno por nome+documento
    const q = query(alunosRef, where("nome", "==", nome), where("documento", "==", documento));
    const querySnapshot = await getDocs(q);
    
    // Garantir que todos os campos tenham valores válidos
    const cargaHoraria = Number(row["cargahoraria"] || row["CARGA HORARIA"] || row["cargaHoraria"] || 0);
    const dataConclusao = row["conclusao"] || row["DATA CONCLUSÃO"] || row["dataConclusao"] || '';
    const dataEmissao = row["dataemissao"] || row["DATA EMISSÃO"] || row["dataEmissao"] || '';
    const empresa = row["empresa"] || row["EMPRESA"] || '';
    const instrutor = row["instrutor"] || row["INSTRUTOR"] || '';
    const treinamento = row["treinamento"] || row["TREINAMENTO"] || '';
    
    const certificado = {
      cargaHoraria: isNaN(cargaHoraria) ? 0 : cargaHoraria,
      dataConclusao: dataConclusao || '',
      dataEmissao: dataEmissao || '',
      documento: documento || '',
      empresa: empresa || '',
      id: planilhaId || '',
      instrutor: instrutor || '',
      nome: nome || '',
      treinamento: treinamento || ''
    };
    
    console.log('Certificado preparado:', certificado);
    
    if (!querySnapshot.empty) {
      console.log('✅ Aluno encontrado, adicionando certificado ao array');
      // Aluno já existe, adiciona certificado ao array (já verificamos que o certificado não existe)
      const alunoDoc = querySnapshot.docs[0];
      const alunoData = alunoDoc.data();
      const certificados = Array.isArray(alunoData.certificados) ? alunoData.certificados : [];
      console.log('📊 Certificados existentes:', certificados.length);
      console.log('👤 Aluno encontrado:', alunoData.nome, 'ID do documento:', alunoDoc.id);
      
      // Adiciona o certificado ao array
      console.log('➕ Adicionando novo certificado ao aluno existente');
      certificados.push(certificado);
      console.log('📊 Array de certificados após adição:', certificados.length, 'certificados');
      await updateDoc(alunoDoc.ref, { certificados });
      results.push({ id: alunoDoc.id, planilhaId });
      console.log('✅ Certificado adicionado com sucesso ao aluno:', alunoData.nome);
      continue;
    }
    
    console.log('🆕 Aluno não encontrado, criando novo documento');
    // Aluno não existe, cria novo documento
    const novoAluno = {
      nome: nome || '',
      documento: documento || '',
      empresa: empresa || '',
      certificados: [certificado]
    };
    console.log('📝 Criando novo aluno da planilha:', novoAluno);
    
    try {
      const docRef = await addDoc(alunosRef, novoAluno);
      results.push({ id: docRef.id, planilhaId });
      console.log('✅ Novo aluno criado com sucesso:', docRef.id, 'Nome:', nome);
    } catch (error) {
      console.error('❌ Erro ao criar novo aluno:', error);
      skipped.push({ linha: row, motivo: "Erro ao criar aluno", id: planilhaId, error: error.message });
    }
  }

  console.log('\n=== RESUMO DO PROCESSAMENTO ===');
  console.log('✅ Certificados criados:', results.length);
  console.log('❌ Certificados pulados:', skipped.length);
  console.log('📊 Total processado:', results.length + skipped.length);
  
  return NextResponse.json({ 
    success: true, 
    created: results.length,
    skipped: skipped.length,
    results: results,
    skippedDetails: skipped
  });
}