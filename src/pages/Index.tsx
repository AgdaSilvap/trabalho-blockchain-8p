import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { ethers } from "ethers";
import { Upload, CheckCircle2, XCircle, FileText } from "lucide-react";

const Index = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    valid: boolean;
    message: string;
  } | null>(null);

  const generateHash = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    return hashHex;
  };

  const checkHashOnBlockchain = async (hash: string): Promise<boolean> => {
    try {
      if (!window.ethereum) {
        throw new Error("MetaMask não está instalado");
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      // Buscar todas as transações do usuário e verificar se alguma contém o hash
      const blockNumber = await provider.getBlockNumber();
      
      // Verificar os últimos 1000 blocos (ajuste conforme necessário)
      const blocksToCheck = Math.min(1000, Number(blockNumber));
      
      for (let i = 0; i < blocksToCheck; i++) {
        const block = await provider.getBlock(blockNumber - i, true);
        if (block?.prefetchedTransactions) {
          for (const tx of block.prefetchedTransactions) {
            if (tx.data && tx.data.includes(hash.slice(2))) {
              return true;
            }
          }
        }
      }
      
      return false;
    } catch (error) {
      console.error("Erro ao verificar blockchain:", error);
      throw error;
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== "application/pdf") {
        toast({
          title: "Arquivo inválido",
          description: "Por favor, selecione um arquivo PDF",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
      setVerificationResult(null);
    }
  };

  const handleVerification = async () => {
    if (!selectedFile) {
      toast({
        title: "Nenhum arquivo selecionado",
        description: "Por favor, selecione um arquivo PDF",
        variant: "destructive",
      });
      return;
    }

    setIsVerifying(true);
    setVerificationResult(null);

    try {
      // Gerar hash do arquivo
      const hash = await generateHash(selectedFile);
      console.log("Hash gerado:", hash);

      // Verificar se hash existe na blockchain
      const exists = await checkHashOnBlockchain(hash);

      if (exists) {
        setVerificationResult({
          valid: true,
          message: "Certificado válido",
        });
        toast({
          title: "✓ Certificado válido",
          description: "Este certificado está registrado na blockchain",
        });
      } else {
        setVerificationResult({
          valid: false,
          message: "Certificado inválido",
        });
        toast({
          title: "✗ Certificado inválido",
          description: "Este certificado não foi encontrado na blockchain",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erro na verificação:", error);
      toast({
        title: "Erro na verificação",
        description: error.message || "Não foi possível verificar o certificado",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold">Verificação de Certificados</h1>
            <p className="text-xl text-muted-foreground mt-2">
              Valide certificados registrados na blockchain
            </p>
          </div>
          <Link to="/login">
            <Button>Login</Button>
          </Link>
        </div>

        {/* Verification Card */}
        <Card className="w-full max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-6 w-6" />
              Verificar Certificado
            </CardTitle>
            <CardDescription>
              Faça upload de um arquivo PDF para verificar sua autenticidade na blockchain
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="pdf-file">Arquivo PDF</Label>
              <div className="flex items-center gap-4">
                <Input
                  id="pdf-file"
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="cursor-pointer"
                />
                <Button
                  onClick={handleVerification}
                  disabled={!selectedFile || isVerifying}
                  className="whitespace-nowrap"
                >
                  {isVerifying ? (
                    "Verificando..."
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Verificar
                    </>
                  )}
                </Button>
              </div>
            </div>

            {selectedFile && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Arquivo selecionado:</p>
                <p className="font-medium">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(selectedFile.size / 1024).toFixed(2)} KB
                </p>
              </div>
            )}

            {verificationResult && (
              <div
                className={`p-6 rounded-lg border-2 flex items-center gap-4 ${
                  verificationResult.valid
                    ? "bg-green-50 border-green-500 dark:bg-green-950"
                    : "bg-red-50 border-red-500 dark:bg-red-950"
                }`}
              >
                {verificationResult.valid ? (
                  <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                ) : (
                  <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
                )}
                <div>
                  <h3
                    className={`text-xl font-bold ${
                      verificationResult.valid
                        ? "text-green-700 dark:text-green-300"
                        : "text-red-700 dark:text-red-300"
                    }`}
                  >
                    {verificationResult.message}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {verificationResult.valid
                      ? "Este documento está registrado e verificado na blockchain"
                      : "Este documento não foi encontrado na blockchain"}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="w-full max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Como funciona?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>1. Selecione o arquivo PDF do certificado que deseja verificar</p>
            <p>2. O sistema irá gerar um hash único do documento</p>
            <p>3. O hash será verificado na blockchain Ethereum via MetaMask</p>
            <p>4. Você receberá a confirmação se o certificado é válido ou não</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;
