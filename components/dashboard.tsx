"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

// Definir tipo Usuario localmente
export interface Usuario {
  id: string
  nome: string
  email: string
  chave_de_acesso: string
  [key: string]: any
}
import { Upload, FileText, LogOut } from "lucide-react"

interface DashboardProps {
  usuario: Usuario
  onLogout: () => void
}

export default function Dashboard({ usuario, onLogout }: DashboardProps) {
  const [arquivoImportado, setArquivoImportado] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)

  const handleImportarArquivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const arquivo = e.target.files?.[0]
    if (arquivo) {
      setArquivoImportado(arquivo)
    }
  }

  const handleGerarCertificados = async () => {
    if (!arquivoImportado) return

    setLoading(true)
    // Aqui você implementaria a lógica de geração de certificados
    setTimeout(() => {
      alert("Certificados gerados com sucesso!")
      setLoading(false)
    }, 2000)
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#ffffff" }}>
      {/* Header */}
      <header className="shadow-sm border-b" style={{ backgroundColor: "#06459a" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <img
                src="/OwlTechLogo.png"
                alt="Logo OwlTech"
                className="w-10 h-10 object-contain bg-white rounded-lg"
                style={{ padding: 2 }}
              />
              <h1 className="text-xl font-bold text-white">Owl Tech - Sistema de Certificados</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-white">Olá, {usuario.nome}</span>
              <Button
                onClick={onLogout}
                variant="outline"
                size="sm"
                className="text-white border-white hover:bg-white hover:text-blue-900 bg-transparent"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Card de Importação */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2" style={{ color: "#06459a" }}>
                <Upload className="h-5 w-5" />
                <span>Importar Arquivo</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="arquivo">Selecione o arquivo para importação</Label>
                <Input id="arquivo" type="file" onChange={handleImportarArquivo} accept=".csv,.xlsx,.xls" />
              </div>
              {arquivoImportado && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-sm text-green-800">
                    <strong>Arquivo selecionado:</strong> {arquivoImportado.name}
                  </p>
                  <p className="text-xs text-green-600">Tamanho: {(arquivoImportado.size / 1024).toFixed(2)} KB</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card de Geração */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2" style={{ color: "#06459a" }}>
                <FileText className="h-5 w-5" />
                <span>Gerar Certificados</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Após importar o arquivo, clique no botão abaixo para gerar os certificados.
                </p>
                <Button
                  onClick={handleGerarCertificados}
                  disabled={!arquivoImportado || loading}
                  className="w-full"
                  style={{
                    backgroundColor: arquivoImportado ? "#06459a" : "#cccccc",
                    color: "#ffffff",
                  }}
                >
                  {loading ? "Gerando..." : "Gerar Certificados"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Informações do Usuário */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle style={{ color: "#06459a" }}>Informações da Conta</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label className="text-sm font-medium text-gray-500">Nome</Label>
                <p className="text-sm">{usuario.nome}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Email</Label>
                <p className="text-sm">{usuario.email}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Chave de Acesso válida até</Label>
                <p className="text-sm">{new Date(usuario.chave_de_acesso).toLocaleDateString("pt-BR")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
