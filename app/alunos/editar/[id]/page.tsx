"use client"
import { useRouter, useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { collection, query, where, getDocs, doc, getDoc, updateDoc, getFirestore, addDoc } from "firebase/firestore"
import { firebaseApp } from "@/lib/firebase"
import { User, Building, Calendar, Clock, Award, ArrowLeft, Save, Edit } from "lucide-react"
import ProtectedRoute from "@/components/protected-route"

interface Certificado {
  id: string
  cargaHoraria: string | number
  dataConclusao: string
  dataEmissao: string
  documento: string
  empresa: string
  instrutor: string
  nome: string
  treinamento: string
}

export default function EditarCertificado() {
  const params = useParams<{ id: string }>()
  const [certificado, setCertificado] = useState<Certificado | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const [alunoId, setAlunoId] = useState<string | null>(null)
  const [certIndex, setCertIndex] = useState<number | null>(null)

  useEffect(() => {
    async function fetchCertificado() {
      try {
        setLoading(true)
        const db = getFirestore(firebaseApp)
        // Buscar o aluno que contém o certificado pelo id do certificado
        const alunosRef = collection(db, "alunos")
        const q = query(alunosRef, where("certificados", ">", []))
        const snapshot = await getDocs(q)
        let found = false
        snapshot.forEach(docSnap => {
          const data = docSnap.data()
          const idx = (data.certificados || []).findIndex((c: any) => c.id === params.id)
          if (idx !== -1) {
            setAlunoId(docSnap.id)
            setCertIndex(idx)
            setCertificado({ ...data.certificados[idx] })
            found = true
          }
        })
        if (!found) {
          setError("Certificado não encontrado")
        }
      } catch (err) {
        setError("Erro ao carregar dados do certificado")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchCertificado()
  }, [params.id])

  const handleSave = async () => {
    if (!certificado || alunoId === null || certIndex === null) return
    try {
      setSaving(true)
      const db = getFirestore(firebaseApp)
      const alunoRef = doc(db, "alunos", alunoId)
      const alunoSnap = await getDoc(alunoRef)
      if (!alunoSnap.exists()) throw new Error("Aluno não encontrado")
      const alunoData = alunoSnap.data()
      
      // Verifica se o nome ou documento do aluno mudou
      const nomeOriginal = alunoData.certificados[certIndex]?.nome || ''
      const nomeNovo = certificado.nome
      const documentoOriginal = alunoData.certificados[certIndex]?.documento || ''
      const documentoNovo = certificado.documento
      const nomeMudou = nomeOriginal !== nomeNovo
      const documentoMudou = documentoOriginal !== documentoNovo
      
      console.log('🔍 Verificando mudanças:', {
        nomeOriginal,
        nomeNovo,
        nomeMudou,
        documentoOriginal,
        documentoNovo,
        documentoMudou
      })
      
      if (nomeMudou || documentoMudou) {
        console.log('🔧 Nome ou documento mudou, movendo certificado para novo aluno')
        
        // Remove o certificado do aluno antigo
        const certificadosAntigos = Array.isArray(alunoData.certificados) ? [...alunoData.certificados] : []
        const certificadoRemovido = certificadosAntigos.splice(certIndex, 1)[0]
        await updateDoc(alunoRef, { certificados: certificadosAntigos })
        console.log('✅ Certificado removido do aluno antigo')
        
        // Verifica se existe um aluno com o novo documento (identificação única)
        const alunosRef = collection(db, "alunos")
        const qNovoAluno = query(alunosRef, where("documento", "==", documentoNovo))
        const novoAlunoSnap = await getDocs(qNovoAluno)
        
        console.log('🔍 Verificando se existe aluno com novo documento:', documentoNovo)
        console.log('🔍 Resultado da busca:', novoAlunoSnap.empty ? 'Não encontrou' : 'Encontrou')
        
        if (!novoAlunoSnap.empty) {
          // Aluno com novo documento já existe, adiciona o certificado
          const novoAlunoDoc = novoAlunoSnap.docs[0]
          const novoAlunoData = novoAlunoDoc.data()
          const novosCertificados = Array.isArray(novoAlunoData.certificados) ? [...novoAlunoData.certificados] : []
          novosCertificados.push(certificado)
          await updateDoc(novoAlunoDoc.ref, { certificados: novosCertificados })
          console.log('✅ Certificado movido para aluno existente com novo documento')
          alert("Certificado movido para aluno com novo documento!")
          // Redireciona para o perfil do novo aluno
          window.location.href = `/alunos/${novoAlunoDoc.id}/${encodeURIComponent(certificado.nome)}`
        } else {
          // Cria novo aluno com o novo documento
          console.log('🔧 Criando novo aluno com documento:', documentoNovo)
          const novoAluno = {
            nome: nomeNovo,
            documento: documentoNovo,
            empresa: certificado.empresa || '',
            certificados: [certificado]
          }
          console.log('📝 Dados do novo aluno:', novoAluno)
          const docRef = await addDoc(alunosRef, novoAluno)
          console.log('✅ Novo aluno criado com ID:', docRef.id)
          alert("Novo aluno criado com certificado atualizado!")
          // Redireciona para o perfil do novo aluno
          window.location.href = `/alunos/${docRef.id}/${encodeURIComponent(certificado.nome)}`
        }
      } else {
        // Nome e documento não mudaram, apenas atualiza o certificado
        console.log('✅ Nome e documento não mudaram, atualizando certificado no aluno existente')
        const certificados = Array.isArray(alunoData.certificados) ? [...alunoData.certificados] : []
        certificados[certIndex] = { ...certificado }
        await updateDoc(alunoRef, { certificados })
        alert("Certificado atualizado com sucesso!")
        // Redireciona para o perfil do aluno
        window.location.href = `/alunos/${alunoId}/${encodeURIComponent(certificado.nome)}`
      }
    } catch (err) {
      setError("Erro ao salvar certificado")
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen" style={{ backgroundColor: "#ffffff" }}>
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Carregando certificado...</span>
        </div>
      </div>
    </div>
  )
  
  if (error) return (
    <div className="min-h-screen" style={{ backgroundColor: "#ffffff" }}>
      <div className="max-w-4xl mx-auto py-8 px-4 text-red-600">{error}</div>
    </div>
  )
  
  if (!certificado) return (
    <div className="min-h-screen" style={{ backgroundColor: "#ffffff" }}>
      <div className="max-w-4xl mx-auto py-8 px-4">Certificado não encontrado.</div>
    </div>
  )

  return (
    <ProtectedRoute>
      <div className="min-h-screen" style={{ backgroundColor: "#ffffff" }}>
        {/* Navbar fixa no topo */}
        <nav className="fixed top-0 left-0 w-full z-50 shadow border-b border-blue-900" style={{height: 60, backgroundColor: '#06459a'}}>
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14">
          <div className="flex items-center gap-4">
            <img src="/OwlTechLogo.png" alt="Logo OwlTech" className="w-8 h-8 object-contain bg-white rounded-lg" style={{ padding: 2 }} />
            <span className="font-bold text-white text-lg">Owl Tech</span>
          </div>
          <div className="flex items-center gap-6">
            <button
              className="text-white hover:text-blue-200 font-medium transition"
              onClick={() => router.push('/dashboard')}
            >
              Dashboard
            </button>
            <button
              className="text-white hover:text-blue-200 font-medium transition border-b-2 border-white"
            >
              Alunos
            </button>
            <button
              className="text-white hover:text-blue-200 font-medium transition"
              onClick={() => router.push('/relatorios')}
            >
              Relatórios
            </button>
            <button
              className="text-white hover:text-blue-200 font-medium transition"
              onClick={() => router.push('/cadastrar-usuario')}
            >
              Usuários
            </button>
            <button
              className="text-white hover:text-blue-200 font-medium transition"
              onClick={() => router.push('/assinaturas')}
            >
              Assinaturas
            </button>
            <button
              className="text-white hover:text-blue-200 font-medium transition"
              onClick={() => router.push('/logout')}
            >
              Sair
            </button>
          </div>
        </div>
      </nav>
      <div style={{height: 60}} /> {/* Espaço para a navbar fixa */}

      {/* Main Content */}
      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header da página */}
        <div className="mb-8">
          <button
            onClick={() => router.push(`/alunos/${certificado.id}/${encodeURIComponent(certificado.nome)}`)}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4 transition"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para perfil do aluno
          </button>
          
          <div className="flex items-center gap-3 mb-2">
            <Edit className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Editar Certificado</h1>
          </div>
        </div>

        {/* Formulário de edição */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <Award className="h-5 w-5" />
              Dados do Certificado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="aluno">Nome do Aluno</Label>
                  <Input
                    id="aluno"
                    value={certificado.nome}
                    onChange={(e) => setCertificado({...certificado, nome: e.target.value})}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="documento">Documento</Label>
                  <Input
                    id="documento"
                    value={certificado.documento}
                    onChange={(e) => setCertificado({...certificado, documento: e.target.value})}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="treinamento">Treinamento</Label>
                  <Input
                    id="treinamento"
                    value={certificado.treinamento}
                    onChange={(e) => setCertificado({...certificado, treinamento: e.target.value})}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="empresa">Empresa</Label>
                  <Input
                    id="empresa"
                    value={certificado.empresa}
                    onChange={(e) => setCertificado({...certificado, empresa: e.target.value})}
                    className="mt-1"
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="instrutor">Instrutor</Label>
                  <Input
                    id="instrutor"
                    value={certificado.instrutor}
                    onChange={(e) => setCertificado({...certificado, instrutor: e.target.value})}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="cargaHoraria">Carga Horária</Label>
                  <Input
                    id="cargaHoraria"
                    value={certificado.cargaHoraria}
                    onChange={(e) => setCertificado({...certificado, cargaHoraria: e.target.value})}
                    placeholder="Ex: 8 horas"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="dataConclusao">Data de Conclusão</Label>
                  <Input
                    id="dataConclusao"
                    value={certificado.dataConclusao}
                    onChange={(e) => setCertificado({...certificado, dataConclusao: e.target.value})}
                    placeholder="Ex: 15 de março de 2024"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="dataEmissao">Data de Emissão</Label>
                  <Input
                    id="dataEmissao"
                    value={certificado.dataEmissao}
                    onChange={(e) => setCertificado({...certificado, dataEmissao: e.target.value})}
                    placeholder="Ex: 20 de março de 2024"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4 mt-8 pt-6 border-t border-gray-200">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
              
              <Button
                onClick={() => router.push(`/alunos/${certificado.id}/${encodeURIComponent(certificado.nome)}`)}
                variant="outline"
              >
                Cancelar
              </Button>
            </div>
                  </CardContent>
      </Card>
    </main>
    </div>
    </ProtectedRoute>
  )
} 