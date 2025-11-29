import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Eip1193Provider, ethers } from "ethers";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Upload, CheckCircle2, AlertCircle, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function Dashboard() {
  const navigate = useNavigate();
  const [isMetaMaskConnected, setIsMetaMaskConnected] = useState(false);
  const [account, setAccount] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [userEmail, setUserEmail] = useState<string>("");

  useEffect(() => {
    checkAuth();
    checkMetaMask();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/login");
      return;
    }
    setUserEmail(session.user.email || "");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logout realizado",
      description: "Você foi desconectado com sucesso.",
    });
    navigate("/login");
  };

  const checkMetaMask = async () => {
    if (typeof window.ethereum !== "undefined") {
      try {
        const accounts = await window.ethereum.request({ 
          method: "eth_accounts" 
        });
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          setIsMetaMaskConnected(true);
        }
      } catch (error) {
        console.error("Error checking MetaMask:", error);
      }
    } else {
      toast({
        variant: "destructive",
        title: "MetaMask não detectado",
        description: "Por favor, instale a extensão MetaMask no seu navegador.",
      });
    }
  };

  const connectMetaMask = async () => {
    if (typeof window.ethereum !== "undefined") {
      try {
        const accounts = await window.ethereum.request({ 
          method: "eth_requestAccounts" 
        });
        setAccount(accounts[0]);
        setIsMetaMaskConnected(true);
        toast({
          title: "MetaMask conectado",
          description: `Conta: ${accounts[0].substring(0, 6)}...${accounts[0].substring(38)}`,
        });
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Erro ao conectar MetaMask",
          description: error.message,
        });
      }
    } else {
      toast({
        variant: "destructive",
        title: "MetaMask não encontrado",
        description: "Instale a extensão MetaMask para continuar.",
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== "application/pdf") {
        toast({
          variant: "destructive",
          title: "Arquivo inválido",
          description: "Por favor, selecione apenas arquivos PDF.",
        });
        return;
      }
      setFile(selectedFile);
    }
  };

  const generateHash = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
    return `0x${hashHex}`;
  };

  const handleUpload = async () => {
    if (!file) {
      toast({
        variant: "destructive",
        title: "Nenhum arquivo selecionado",
        description: "Selecione um arquivo PDF primeiro.",
      });
      return;
    }

    if (!isMetaMaskConnected) {
      toast({
        variant: "destructive",
        title: "MetaMask não conectado",
        description: "Conecte sua carteira MetaMask primeiro.",
      });
      return;
    }

    setIsUploading(true);

    try {
      const fileHash = await generateHash(file);
      console.log("Hash do arquivo:", fileHash);

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const tx = await signer.sendTransaction({
        to: account, 
        value: 0,
        data: fileHash,
      });

      toast({
        title: "Transação enviada",
        description: "Aguardando confirmação na blockchain...",
      });

      const receipt = await tx.wait();

      toast({
        title: "Sucesso!",
        description: (
          <div className="flex flex-col gap-2">
            <p className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Arquivo registrado na blockchain
            </p>
            <p className="text-sm">
              <strong>ID da Transação:</strong>
              <br />
              <code className="text-xs break-all">{receipt?.hash}</code>
            </p>
          </div>
        ),
      });

      setFile(null);
      const input = document.getElementById("file-upload") as HTMLInputElement;
      if (input) input.value = "";

    } catch (error) {
      console.error("Erro no upload:", error);
      toast({
        variant: "destructive",
        title: "Erro no registro",
        description: (
          <div className="flex flex-col gap-2">
            <p className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {error.message || "Erro ao registrar na blockchain"}
            </p>
            {error.reason && (
              <p className="text-sm">
                <strong>Motivo:</strong> {error.reason}
              </p>
            )}
          </div>
        ),
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            {userEmail && <p className="text-sm text-muted-foreground">{userEmail}</p>}
          </div>
          <Button onClick={handleLogout} variant="outline">
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Status MetaMask</CardTitle>
            <CardDescription>
              Conecte sua carteira para registrar documentos na blockchain
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!isMetaMaskConnected ? (
              <Button onClick={connectMetaMask} className="w-full">
                Conectar MetaMask
              </Button>
            ) : (
              <div className="flex items-center gap-2 p-4 bg-muted rounded-md">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <div>
                  <p className="font-medium">Conectado</p>
                  <p className="text-sm text-muted-foreground">
                    {account.substring(0, 6)}...{account.substring(38)}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upload de Documento PDF</CardTitle>
            <CardDescription>
              Faça upload de um arquivo PDF para registrar seu hash na blockchain
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="file-upload">Selecione o arquivo PDF</Label>
              <Input
                id="file-upload"
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                disabled={isUploading}
              />
              {file && (
                <p className="text-sm text-muted-foreground">
                  Arquivo selecionado: {file.name} ({(file.size / 1024).toFixed(2)} KB)
                </p>
              )}
            </div>

            <Button
              onClick={handleUpload}
              disabled={!file || !isMetaMaskConnected || isUploading}
              className="w-full"
            >
              <Upload className="mr-2 h-4 w-4" />
              {isUploading ? "Processando..." : "Registrar na Blockchain"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

declare global {
  interface Window {
    ethereum?: Eip1193Provider;
  }
}
