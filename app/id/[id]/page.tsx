'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react'

interface CertificadoInfo {
  id: string
  aluno: string
  documento: string
  treinamento: string
  empresa: string
  cargaHoraria: string
  instrutor: string
  dataConclusao: string
  dataEmissao: string
  certificado: string
}

export default function VerificarCertificado({ params }: { params: { id: string } }) {
  const [certificado, setCertificado] = useState<CertificadoInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [inputId, setInputId] = useState('')
  const [idValidado, setIdValidado] = useState(false)
  const [idErro, setIdErro] = useState<string | null>(null)

  useEffect(() => {
    const verificarCertificado = async () => {
      try {
        const response = await fetch(`/api/verificar-certificado?id=${params.id}`)
        if (!response.ok) {
          throw new Error('Certificado não encontrado')
        }
        const data = await response.json()
        setCertificado(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao verificar certificado')
      } finally {
        setLoading(false)
      }
    }
    verificarCertificado()
  }, [params.id])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando certificado...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-2xl mx-auto">
          <Card className="shadow-lg">
            <CardHeader className="text-center bg-gradient-to-r from-red-600 to-red-700 text-white">
              <XCircle className="h-12 w-12 mx-auto mb-4" />
              <CardTitle className="text-2xl">Certificado Inválido</CardTitle>
              <p className="text-red-100">Este certificado não foi encontrado em nossa base de dados</p>
            </CardHeader>
            <CardContent className="p-6">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Erro:</strong> {error}
                </AlertDescription>
              </Alert>
              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
                  <p className="text-yellow-800 font-medium">
                    Este certificado não foi emitido por nossa instituição ou não existe em nossa base de dados.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!certificado) {
    return null
  }

  // NOVO: Tela de input para o ID da planilha
  if (!idValidado) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full mx-auto">
          <Card className="shadow-lg">
            <CardHeader className="text-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
              <CardTitle className="text-2xl">Validação de Certificado</CardTitle>
              <p className="text-blue-100">Digite o ID do certificado para validar</p>
            </CardHeader>
            <CardContent className="p-6">
              <form
                onSubmit={e => {
                  e.preventDefault()
                  if (inputId.trim() === String(certificado.id).trim()) {
                    setIdValidado(true)
                    setIdErro(null)
                  } else {
                    setIdErro('ID incorreto. Por favor, verifique e tente novamente.')
                  }
                }}
                className="space-y-4"
              >
                <label htmlFor="id-input" className="block text-sm font-medium text-gray-700 mb-1">ID do Certificado</label>
                <input
                  id="id-input"
                  type="text"
                  value={inputId}
                  onChange={e => setInputId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="Digite o ID presente na planilha"
                  autoFocus
                />
                {idErro && (
                  <div className="text-red-600 text-sm flex items-center gap-2">
                    <XCircle className="h-4 w-4" />
                    {idErro}
                  </div>
                )}
                <button
                  type="submit"
                  className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold py-2 px-4 rounded"
                >
                  Validar ID
                </button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-lg">
          <CardHeader className="text-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
            <CheckCircle className="h-12 w-12 mx-auto mb-4" />
            <CardTitle className="text-2xl">Certificado Válido</CardTitle>
            <p className="text-blue-100">Este certificado foi emitido por nossa instituição</p>
          </CardHeader>
          
          <CardContent className="p-6">
            <div className="space-y-6">
              <div className="text-center mb-6">
                <Badge variant="secondary" className="text-sm">
                  ID: {certificado.id}
                </Badge>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h3 className="font-semibold text-gray-700 mb-1">Nome do Aluno</h3>
                  <p className="text-lg font-medium">{certificado.nome}</p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-700 mb-1">Documento</h3>
                  <p className="text-lg">{certificado.documento}</p>
                </div>

                <div className="md:col-span-2">
                  <h3 className="font-semibold text-gray-700 mb-1">Treinamento</h3>
                  <p className="text-lg font-medium text-blue-600">{certificado.treinamento}</p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-700 mb-1">Empresa</h3>
                  <p className="text-lg">{certificado.empresa}</p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-700 mb-1">Carga Horária</h3>
                  <p className="text-lg">{certificado.cargaHoraria}</p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-700 mb-1">Data de Conclusão</h3>
                  <p className="text-lg">{certificado.dataConclusao}</p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-700 mb-1">Data de Emissão</h3>
                  <p className="text-lg">{certificado.dataEmissao}</p>
                </div>

                <div className="md:col-span-2">
                  <h3 className="font-semibold text-gray-700 mb-1">Responsável Técnico</h3>
                  <p className="text-lg">{certificado.instrutor}</p>
                </div>

               
              </div>

              <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                  <p className="text-green-800 font-medium">
                    Este certificado é válido e foi emitido oficialmente por nossa instituição.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 