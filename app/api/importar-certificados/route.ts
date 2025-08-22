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
    // Recebe dados agrupados por aluno
    const data = await req.json();
    
    // Verifica se é o novo formato (certificados agrupados por aluno)
    if (data.certificados && Array.isArray(data.certificados)) {
      console.log('📊 Processando certificados agrupados por aluno');
      console.log(`📝 Aluno: ${data.nome} - ${data.documento}`);
      console.log(`📋 Total de certificados: ${data.certificados.length}`);
      
      // Busca aluno por documento (identificação única)
      const alunosRef = collection(firestore, "alunos");
      const q = query(alunosRef, where("documento", "==", data.documento));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        // Aluno já existe, adiciona certificados ao array
        const alunoDoc = querySnapshot.docs[0];
        const alunoData = alunoDoc.data();
        const certificados = Array.isArray(alunoData.certificados) ? alunoData.certificados : [];
        
        // Filtra certificados que já existem (pelo ID da planilha)
        const certificadosNovos = [];
        const certificadosExistentes = [];
        
        for (const certificado of data.certificados) {
          const certificadoJaExiste = certificados.some((c: any) => String(c.id) === String(certificado.id));
          
          if (certificadoJaExiste) {
            if (modoCorrecao) {
              // No modo correção, atualiza o certificado existente
              const index = certificados.findIndex((c: any) => String(c.id) === String(certificado.id));
              if (index !== -1) {
                certificados[index] = {
                  cargaHoraria: certificado.cargaHoraria || 0,
                  dataConclusao: certificado.dataConclusao || '',
                  dataEmissao: certificado.dataEmissao || '',
                  documento: certificado.documento || '',
                  empresa: certificado.empresa || '',
                  id: certificado.id || '',
                  instrutor: certificado.instrutor || '',
                  nome: certificado.nome || '',
                  treinamento: certificado.treinamento || ''
                };
                console.log(`✅ Certificado ${certificado.id} atualizado no modo correção`);
              }
            } else {
              certificadosExistentes.push(certificado);
              console.log(`⏭️ Certificado ${certificado.id} já existe, pulando`);
            }
          } else {
            certificadosNovos.push(certificado);
            console.log(`✅ Certificado ${certificado.id} é novo`);
          }
        }
        
        // Adiciona novos certificados
        if (certificadosNovos.length > 0) {
          certificados.push(...certificadosNovos);
          console.log(`➕ ${certificadosNovos.length} novos certificados adicionados`);
        }
        
        // Atualiza o aluno no banco
        await updateDoc(alunoDoc.ref, { certificados });
        
        // Cria array de resultados para compatibilidade com o frontend
        const results = [];
        certificadosNovos.forEach(certificado => {
          results.push({ 
            id: alunoDoc.id, 
            planilhaId: certificado.id,
            status: 'adicionado'
          });
        });
        
        // No modo correção, adiciona também os certificados atualizados
        if (modoCorrecao) {
          certificadosExistentes.forEach(certificado => {
            results.push({ 
              id: alunoDoc.id, 
              planilhaId: certificado.id,
              status: 'atualizado'
            });
          });
        }
        
        return NextResponse.json({ 
          success: true, 
          id: alunoDoc.id, 
          exists: false,
          novos: certificadosNovos.length,
          atualizados: modoCorrecao ? data.certificados.length - certificadosNovos.length : 0,
          existentes: certificadosExistentes.length,
          results: results
        });
      } else {
        // Aluno não existe, cria novo com todos os certificados
        console.log(`🆕 Criando novo aluno para documento: ${data.documento}`);
        const novoAluno = {
          nome: data.nome || '',
          documento: data.documento || '',
          empresa: data.empresa || '',
          certificados: data.certificados.map((cert: any) => ({
            cargaHoraria: cert.cargaHoraria || 0,
            dataConclusao: cert.dataConclusao || '',
            dataEmissao: cert.dataEmissao || '',
            documento: cert.documento || '',
            empresa: cert.empresa || '',
            id: cert.id || '',
            instrutor: cert.instrutor || '',
            nome: cert.nome || '',
            treinamento: cert.treinamento || ''
          }))
        };
        
        const docRef = await addDoc(alunosRef, novoAluno);
        console.log(`✅ Novo aluno criado com ID: ${docRef.id} e ${data.certificados.length} certificados`);
        
        // Cria array de resultados para compatibilidade com o frontend
        const results = [];
        data.certificados.forEach((cert: any) => {
          results.push({ 
            id: docRef.id, 
            planilhaId: cert.id,
            status: 'criado'
          });
        });
        
        return NextResponse.json({ 
          success: true, 
          id: docRef.id, 
          exists: false,
          novos: data.certificados.length,
          atualizados: 0,
          existentes: 0,
          results: results
        });
      }
    } else {
      // Formato antigo (certificado individual) - mantém compatibilidade
      console.log('📊 Processando certificado individual (formato antigo)');

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

      // Busca aluno por documento (identificação única)
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

            // Verifica se o documento do aluno mudou (identificação única)
            const documentoMudou = alunoEncontrado.data.documento !== data.documento;

            console.log('🔍 Mudanças detectadas - Documento mudou:', documentoMudou);

            if (documentoMudou) {
              console.log('🔧 Modo correção: Documento mudou, movendo certificado para novo aluno');

              // Remove o certificado do aluno antigo
              certificados.splice(index, 1);
              await updateDoc(alunoEncontrado.doc.ref, { certificados });
              console.log('✅ Certificado removido do aluno antigo');

              // Verifica se existe um aluno com o novo documento
              const qNovoAluno = query(alunosRef, where("documento", "==", data.documento));
              const novoAlunoSnap = await getDocs(qNovoAluno);

              console.log('🔍 Verificando se existe aluno com novo documento:', data.documento);
              console.log('🔍 Resultado da busca:', novoAlunoSnap.empty ? 'Não encontrou' : 'Encontrou');

              if (!novoAlunoSnap.empty) {
                // Aluno com novo documento já existe, adiciona o certificado
                const novoAlunoDoc = novoAlunoSnap.docs[0];
                const novoAlunoData = novoAlunoDoc.data();
                const novosCertificados = Array.isArray(novoAlunoData.certificados) ? novoAlunoData.certificados : [];
                novosCertificados.push(certificadoAtualizado);
                await updateDoc(novoAlunoDoc.ref, { certificados: novosCertificados });
                console.log('✅ Certificado movido para aluno existente com novo documento');
                return NextResponse.json({
                  success: true,
                  exists: false,
                  id: novoAlunoDoc.id,
                  message: "Certificado movido para aluno com novo documento"
                });
              } else {
                // Cria novo aluno com o novo documento
                console.log('🔧 Criando novo aluno com documento:', data.documento);
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
              // Documento não mudou, apenas atualiza o certificado
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
        // Busca normal por documento (identificação única)
        const q = query(alunosRef, where("documento", "==", data.documento));
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

  console.log('🚀 INICIANDO PROCESSAMENTO DA PLANILHA');
  console.log('📊 Total de linhas a processar:', data.length);
  console.log('📋 Primeiras 3 linhas da planilha:', data.slice(0, 3));

  // Primeiro, agrupa todos os certificados por documento (identificação única)
  console.log('📋 Agrupando certificados por documento (identificação única)...');
  const certificadosPorDocumento = {};

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const planilhaId = row["id"] || row["ID"] || "";
    const nome = (row["aluno"] || row["ALUNO"] || "").trim();
    const documento = String(row["documento"] || row["DOCUMENTO"] || "").trim();

         console.log(`📝 Linha ${i + 1}: ID=${planilhaId}, Nome="${nome}", Doc="${documento}"`);

     if (!planilhaId || !nome || !documento) {
       console.log(`❌ Pulando linha ${i + 1} - dados inválidos`);
       skipped.push({ linha: row, motivo: "Dados inválidos" });
       continue;
     }

     // Normaliza o documento removendo pontos, traços e espaços
     const documentoNormalizado = documento.replace(/[.\-\s]/g, '');

     if (!certificadosPorDocumento[documentoNormalizado]) {
       certificadosPorDocumento[documentoNormalizado] = {
         nome: nome,
         documento: documento, // Mantém o documento original para exibição
         documentoNormalizado: documentoNormalizado, // Para comparações
         empresa: row["empresa"] || row["EMPRESA"] || '',
         certificados: []
       };
       console.log(`🆕 Novo grupo criado para documento: ${documento} (normalizado: ${documentoNormalizado})`);
     }

     const certificado = {
       cargaHoraria: Number(row["cargahoraria"] || row["CARGA HORARIA"] || row["cargaHoraria"] || 0),
       dataConclusao: row["conclusao"] || row["DATA CONCLUSÃO"] || row["dataConclusao"] || '',
       dataEmissao: row["dataemissao"] || row["DATA EMISSÃO"] || row["dataEmissao"] || '',
       documento: documento,
       empresa: row["empresa"] || row["EMPRESA"] || '',
       id: planilhaId,
       instrutor: row["instrutor"] || row["INSTRUTOR"] || '',
       nome: nome,
       treinamento: row["treinamento"] || row["TREINAMENTO"] || ''
     };

     certificadosPorDocumento[documentoNormalizado].certificados.push(certificado);
     console.log(`➕ Certificado ${planilhaId} adicionado ao grupo do documento ${documento} (normalizado: ${documentoNormalizado})`);
   }

   console.log('\n📊 GRUPOS CRIADOS:');
   Object.keys(certificadosPorDocumento).forEach(documentoNormalizado => {
     const dados = certificadosPorDocumento[documentoNormalizado];
     console.log(`  - Documento: "${dados.documento}" (normalizado: ${documentoNormalizado})`);
     console.log(`    Nome: ${dados.nome}`);
     console.log(`    Total de certificados: ${dados.certificados.length}`);
   });

   console.log(`\n🔍 Total de grupos únicos: ${Object.keys(certificadosPorDocumento).length}`);

  console.log('📊 Certificados agrupados por documento:', Object.keys(certificadosPorDocumento).length);

  // Busca todos os alunos existentes uma única vez
  const todosAlunosRef = collection(firestore, "alunos");
  const todosAlunosSnap = await getDocs(todosAlunosRef);

  // Agora processa cada documento
  for (const [documentoNormalizado, dadosAluno] of Object.entries(certificadosPorDocumento)) {
    console.log(`\n=== PROCESSANDO DOCUMENTO: ${dadosAluno.documento} ===`);
    console.log(`👤 Aluno: ${dadosAluno.nome} - ${dadosAluno.certificados.length} certificados`);

    // Busca aluno por documento (identificação única)
    let alunoEncontrado = null;

    console.log(`🔍 Buscando aluno com documento: "${dadosAluno.documento}" (normalizado: ${documentoNormalizado})`);

    for (const docSnap of todosAlunosSnap.docs) {
      const data = docSnap.data();
      const documentoAluno = String(data.documento || '').trim();
      const documentoAlunoNormalizado = documentoAluno.replace(/[.\-\s]/g, '');

      console.log(`  Comparando: "${documentoAluno}" (normalizado: ${documentoAlunoNormalizado}) vs "${dadosAluno.documento}" (normalizado: ${documentoNormalizado})`);

      if (documentoAlunoNormalizado === documentoNormalizado) {
        alunoEncontrado = { doc: docSnap, data: data };
        console.log(`✅ Aluno encontrado no banco: ${data.nome} (ID: ${docSnap.id})`);
        break;
      }
    }

    // Verifica certificados novos APÓS encontrar o aluno (não antes)
    const certificadosNovos = [];
    const certificadosExistentes = alunoEncontrado ? 
      (Array.isArray(alunoEncontrado.data.certificados) ? alunoEncontrado.data.certificados : []) : 
      [];

    for (const certificado of dadosAluno.certificados) {
      // Verifica se o certificado já existe APENAS no aluno atual (não globalmente)
      const certificadoJaExiste = certificadosExistentes.some((c: any) => String(c.id) === String(certificado.id));
      
      if (!certificadoJaExiste) {
        certificadosNovos.push(certificado);
        console.log(`✅ Certificado ${certificado.id} é novo para este aluno`);
      } else {
        console.log(`⏭️ Certificado ${certificado.id} já existe neste aluno, pulando`);
      }
    }

    if (certificadosNovos.length === 0) {
      console.log('❌ Todos os certificados já existem para este aluno, pulando');
      continue;
    }

    console.log(`✅ ${certificadosNovos.length} certificados novos para processar`);

    if (alunoEncontrado) {
      // Aluno já existe, adiciona certificados ao array
      const certificados = Array.isArray(alunoEncontrado.data.certificados) ? alunoEncontrado.data.certificados : [];
      console.log(`📊 Certificados existentes: ${certificados.length}`);

      certificadosNovos.forEach(certificado => {
        certificados.push(certificado);
        results.push({ id: alunoEncontrado.doc.id, planilhaId: certificado.id });
      });

      await updateDoc(alunoEncontrado.doc.ref, { certificados });
      console.log(`✅ ${certificadosNovos.length} certificados adicionados ao aluno existente`);
    } else {
      // Aluno não existe, cria novo com todos os certificados
      console.log(`🆕 Criando novo aluno para documento: ${dadosAluno.documento}`);
      const novoAluno = {
        nome: dadosAluno.nome,
        documento: dadosAluno.documento,
        empresa: dadosAluno.empresa,
        certificados: certificadosNovos
      };

      const docRef = await addDoc(alunosRef, novoAluno);
      
      // IMPORTANTE: Adiciona TODOS os certificados novos aos resultados
      certificadosNovos.forEach(certificado => {
        results.push({ 
          id: docRef.id, 
          planilhaId: certificado.id,
          status: 'criado'
        });
        console.log(`✅ Certificado ${certificado.id} adicionado aos resultados com ID do Firestore: ${docRef.id}`);
      });
      
      console.log(`✅ Novo aluno criado com ID: ${docRef.id} e ${certificadosNovos.length} certificados`);
      console.log(`📝 Results atualizados:`, results);
    }
  }

  // Log final para debug
  console.log(`\n RESUMO FINAL:`);
  console.log(`📊 Total de resultados:`, results.length);
  console.log(` Results:`, results);

  return NextResponse.json({
    success: true,
    created: results.length,
    skipped: skipped.length,
    results: results,
    skippedDetails: skipped
  });
}
