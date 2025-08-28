"use client"

import { formatBackupDate } from '@/lib/dateUtils';
// Passo 1: Adicionar useEffect
import { useState, useMemo, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Package,
  ShoppingCart,
  DollarSign,
  Users,
  FileText,
  Bell,
  Settings,
  Plus,
  Search,
  Download,
  AlertTriangle,
  CheckCircle,
  Clock,
  X,
  LayoutDashboard,
} from "lucide-react"

// Tipos de dados
interface Product {
  id: string
  name: string
  category: string
  quantity: number
  price: number
  minStock: number
  supplier: string
}

interface Sale {
  id: string
  date: string
  customer: string
  items: { productId: string; quantity: number; price: number }[]
  total: number
  status: "paga" | "pendente" | "cancelada"
  paymentMethod: string
}

interface Customer {
  id: string
  name: string
  email: string
  phone: string
  totalPurchases: number
  lastPurchase: string
  status: "ativo" | "inativo"
}

interface Transaction {
  id: string
  date: string
  description: string
  amount: number
  type: "receita" | "despesa"
  category: string
  status: "pago" | "pendente"
}

interface Notification {
  id: string
  title: string
  message: string
  type: "info" | "warning" | "success" | "error"
  read: boolean
  date: string
}

export default function ERPSystem() {
  const [showSaleDetails, setShowSaleDetails] = useState(false)
  const [showCustomerDetails, setShowCustomerDetails] = useState(false)
  const [showEditProduct, setShowEditProduct] = useState(false)
  const [selectedSale, setSelectedSale] = useState<any>(null)
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null)
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [editingProduct, setEditingProduct] = useState({
    name: "",
    category: "",
    quantity: 0,
    price: 0,
  })

  // Passo 2: Adicionar os estados para o backup
  const [lastBackup, setLastBackup] = useState("Carregando...");
  const [nextBackup, setNextBackup] = useState("Carregando...");

  const [activeModule, setActiveModule] = useState("dashboard")
  const [showNotifications, setShowNotifications] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  // Estados para configurações
  const [settings, setSettings] = useState({
    darkMode: false,
    emailNotifications: true,
    autoBackup: "diario",
    companyName: "Minha Empresa Ltda",
    cnpj: "00.000.000/0001-00",
    email: "contato@minhaempresa.com",
  })

  // Dados iniciais (começam vazios para cálculos dinâmicos)
  const [products, setProducts] = useState<Product[]>([])

  const [sales, setSales] = useState<Sale[]>([])

  const [customers, setCustomers] = useState<Customer[]>([])

  const [transactions, setTransactions] = useState<Transaction[]>([])

  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "1",
      title: "Estoque Baixo",
      message: "Teclado Mecânico com apenas 3 unidades",
      type: "warning",
      read: false,
      date: "2024-01-15",
    },
    {
      id: "2",
      title: "Venda Confirmada",
      message: "Venda #001 foi confirmada",
      type: "success",
      read: false,
      date: "2024-01-15",
    },
    {
      id: "3",
      title: "Backup Realizado",
      message: "Backup automático concluído",
      type: "info",
      read: true,
      date: "2024-01-15",
    },
  ])

  const [showAddProduct, setShowAddProduct] = useState(false)
  const [showAddSale, setShowAddSale] = useState(false)
  const [showAddCustomer, setShowAddCustomer] = useState(false)
  const [newProduct, setNewProduct] = useState({ name: "", category: "", quantity: 0, price: 0 })
  const [newSale, setNewSale] = useState({ customer: "", total: 0, payment: "" })
  const [newCustomer, setNewCustomer] = useState({ name: "", email: "", phone: "", address: "" })

  // Passo 3: Adicionar o useEffect para buscar os dados
  useEffect(() => {
    // Função para buscar os dados do backup
    const fetchBackupStatus = async () => {
      try {
        const response = await fetch('/api/backup-status');
        if (!response.ok) {
          throw new Error('Falha ao buscar dados do backup');
        }
        const data = await response.json();

        // Atualiza os estados com os dados formatados
        setLastBackup(formatBackupDate(data.lastBackup));
        setNextBackup(formatBackupDate(data.nextBackup));

      } catch (error) {
        console.error("Erro ao buscar status do backup:", error);
        setLastBackup("Erro ao carregar");
        setNextBackup("Erro ao carregar");
      }
    };

    fetchBackupStatus();
  }, []); // O array vazio [] garante que isso rode apenas uma vez

  // Cálculos dinâmicos baseados nos dados reais
  const dashboardMetrics = useMemo(() => {
    const totalRevenue = sales.filter((s) => s.status === "paga").reduce((sum, sale) => sum + sale.total, 0)
    const totalSales = sales.length
    const totalCustomers = customers.length
    const totalProducts = products.reduce((sum, product) => sum + product.quantity, 0)
    const paidSales = sales.filter((s) => s.status === "paga")
    const pendingSales = sales.filter((s) => s.status === "pendente")
    const lowStockProducts = products.filter((p) => p.quantity <= p.minStock)

    return {
      totalRevenue,
      totalSales,
      totalCustomers,
      totalProducts,
      paidSalesCount: paidSales.length,
      paidSalesValue: paidSales.reduce((sum, sale) => sum + sale.total, 0),
      pendingSalesCount: pendingSales.length,
      pendingSalesValue: pendingSales.reduce((sum, sale) => sum + sale.total, 0),
      lowStockCount: lowStockProducts.length,
      averageTicket: totalSales > 0 ? totalRevenue / paidSales.length : 0,
    }
  }, [sales, customers, products])

  // Funções para configurações
  const handleSettingChange = (key: string, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  const saveSettings = () => {
    console.log("[v0] Configurações salvas:", settings)
    setShowSettings(false)
    // Aqui você salvaria as configurações no backend
  }

  const cancelSettings = () => {
    setShowSettings(false)
    // Resetar para valores anteriores se necessário
  }

  // Função para marcar notificação como lida
  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) => prev.map((notif) => (notif.id === id ? { ...notif, read: true } : notif)))
  }

  // Função para remover notificação
  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((notif) => notif.id !== id))
  }

  // Função para exportar relatórios
  const exportToPDF = () => {
    console.log("[v0] Exportando relatório em PDF...")
    // Implementar exportação PDF
    alert("Funcionalidade de exportação PDF será implementada")
  }

  const exportToExcel = () => {
    console.log("[v0] Exportando relatório em Excel...")
    // Implementar exportação Excel
    alert("Funcionalidade de exportação Excel será implementada")
  }

  const addProduct = () => {
    console.log("[v0] Tentando adicionar produto:", newProduct)

    if (!newProduct.name.trim()) {
      console.log("[v0] Nome do produto vazio")
      return
    }
    if (!newProduct.category) {
      console.log("[v0] Categoria não selecionada")
      return
    }
    if (newProduct.quantity <= 0) {
      console.log("[v0] Quantidade inválida:", newProduct.quantity)
      return
    }
    if (newProduct.price <= 0) {
      console.log("[v0] Preço inválido:", newProduct.price)
      return
    }

    const product = {
      id: (products.length + 1).toString(),
      name: newProduct.name.trim(),
      category: newProduct.category,
      quantity: newProduct.quantity,
      price: newProduct.price,
      minStock: 5,
      supplier: "Genérico",
    }

    console.log("[v0] Adicionando produto:", product)
    setProducts([...products, product])
    setNewProduct({ name: "", category: "", quantity: 0, price: 0 })
    setShowAddProduct(false)
  }

  const addSale = () => {
    console.log("[v0] Tentando adicionar venda:", newSale)

    if (!newSale.customer || !newSale.total || !newSale.payment) {
      console.log("[v0] Campos obrigatórios não preenchidos")
      return
    }

    const sale = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString("pt-BR"),
      customer: newSale.customer,
      items: [], // Adicionado para conformidade com o tipo Sale
      total: newSale.total,
      paymentMethod: newSale.payment,
      status: "paga" as const,
    }

    setSales([...sales, sale])

    // Criar transação financeira automaticamente
    const transaction = {
      id: (Date.now() + 1).toString(),
      date: new Date().toLocaleDateString("pt-BR"),
      description: `Venda para ${newSale.customer}`,
      type: "receita" as const,
      amount: newSale.total,
      category: "Vendas", // Adicionado para conformidade com o tipo Transaction
      status: "pago" as const,
    }

    setTransactions([...transactions, transaction])

    setNewSale({ customer: "", total: 0, payment: "" })
    setShowAddSale(false)
    console.log("[v0] Venda adicionada com sucesso e transação financeira criada")
  }

  const viewSaleDetails = (sale: any) => {
    setSelectedSale(sale)
    setShowSaleDetails(true)
  }

  const viewCustomerDetails = (customer: any) => {
    setSelectedCustomer(customer)
    setShowCustomerDetails(true)
  }

  const editProduct = (product: any) => {
    setSelectedProduct(product)
    setEditingProduct({
      name: product.name,
      category: product.category,
      quantity: product.quantity,
      price: product.price,
    })
    setShowEditProduct(true)
  }

  const updateProduct = () => {
    if (!editingProduct.name || !editingProduct.category || editingProduct.quantity < 0 || editingProduct.price < 0) {
      return
    }

    const updatedProducts = products.map((p) => (p.id === selectedProduct.id ? { ...p, ...editingProduct } : p))

    setProducts(updatedProducts)
    setShowEditProduct(false)
    setSelectedProduct(null)
  }

  const deleteProduct = () => {
    const updatedProducts = products.filter((p) => p.id !== selectedProduct.id)
    setProducts(updatedProducts)
    setShowEditProduct(false)
    setSelectedProduct(null)
  }

  const addCustomer = () => {
    if (newCustomer.name && newCustomer.email) {
      const customer = {
        id: (customers.length + 1).toString(),
        name: newCustomer.name,
        email: newCustomer.email,
        phone: newCustomer.phone,
        totalPurchases: 0,
        lastPurchase: new Date().toISOString().split("T")[0],
        status: "ativo" as const,
      }
      setCustomers([...customers, customer])
      setNewCustomer({ name: "", email: "", phone: "", address: "" })
      setShowAddCustomer(false)
    }
  }

  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {dashboardMetrics.totalRevenue.toLocaleString("pt-BR")}</div>
            <p className="text-xs text-muted-foreground">{dashboardMetrics.paidSalesCount} vendas confirmadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Vendas</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardMetrics.totalSales}</div>
            <p className="text-xs text-muted-foreground">{dashboardMetrics.pendingSalesCount} pendentes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardMetrics.totalCustomers}</div>
            <p className="text-xs text-muted-foreground">clientes ativos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produtos em Estoque</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardMetrics.totalProducts}</div>
            <p className="text-xs text-muted-foreground">{dashboardMetrics.lowStockCount} com estoque baixo</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Vendas Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sales.slice(0, 5).map((sale) => (
                <div key={sale.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{sale.customer}</p>
                    <p className="text-sm text-muted-foreground">{sale.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">R$ {sale.total.toLocaleString("pt-BR")}</p>
                    <Badge
                      variant={
                        sale.status === "paga" ? "default" : sale.status === "pendente" ? "secondary" : "destructive"
                      }
                    >
                      {sale.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Produtos com Estoque Baixo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {products
                .filter((p) => p.quantity <= p.minStock)
                .map((product) => (
                  <div key={product.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-muted-foreground">{product.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-red-600">{product.quantity} unidades</p>
                      <p className="text-sm text-muted-foreground">Mín: {product.minStock}</p>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  const renderInventory = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gestão de Estoque</h2>
        <Button onClick={() => setShowAddProduct(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Produto
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total de Produtos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Valor Total do Estoque</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {products.reduce((sum, p) => sum + p.quantity * p.price, 0).toLocaleString("pt-BR")}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Produtos com Estoque Baixo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {products.filter((p) => p.quantity <= p.minStock).length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Produtos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Produto</th>
                  <th className="text-left p-2">Categoria</th>
                  <th className="text-left p-2">Quantidade</th>
                  <th className="text-left p-2">Preço</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Ações</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-b">
                    <td className="p-2 font-medium">{product.name}</td>
                    <td className="p-2">{product.category}</td>
                    <td className="p-2">{product.quantity}</td>
                    <td className="p-2">R$ {product.price.toLocaleString("pt-BR")}</td>
                    <td className="p-2">
                      <Badge variant={product.quantity <= product.minStock ? "destructive" : "default"}>
                        {product.quantity <= product.minStock ? "Estoque Baixo" : "Normal"}
                      </Badge>
                    </td>
                    <td className="p-2">
                      <Button variant="outline" size="sm" onClick={() => editProduct(product)}>
                        Editar
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderSales = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Sistema de Vendas</h2>
        <Button onClick={() => setShowAddSale(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Venda
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total de Vendas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {dashboardMetrics.totalRevenue.toLocaleString("pt-BR")}</div>
            <p className="text-xs text-muted-foreground">{dashboardMetrics.totalSales} transações</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Ticket Médio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {dashboardMetrics.averageTicket.toLocaleString("pt-BR")}</div>
            <p className="text-xs text-muted-foreground">Por transação</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Vendas Pagas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {dashboardMetrics.paidSalesValue.toLocaleString("pt-BR")}</div>
            <p className="text-xs text-muted-foreground">{dashboardMetrics.paidSalesCount} vendas confirmadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Vendas Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {dashboardMetrics.pendingSalesValue.toLocaleString("pt-BR")}</div>
            <p className="text-xs text-muted-foreground">{dashboardMetrics.pendingSalesCount} vendas pendentes</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Vendas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Data</th>
                  <th className="text-left p-2">Cliente</th>
                  <th className="text-left p-2">Valor</th>
                  <th className="text-left p-2">Pagamento</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Ações</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((sale) => (
                  <tr key={sale.id} className="border-b">
                    <td className="p-2">{sale.date}</td>
                    <td className="p-2 font-medium">{sale.customer}</td>
                    <td className="p-2">R$ {sale.total.toLocaleString("pt-BR")}</td>
                    <td className="p-2">{sale.paymentMethod}</td>
                    <td className="p-2">
                      <Badge
                        variant={
                          sale.status === "paga" ? "default" : sale.status === "pendente" ? "secondary" : "destructive"
                        }
                      >
                        {sale.status}
                      </Badge>
                    </td>
                    <td className="p-2">
                      <Button variant="outline" size="sm" onClick={() => viewSaleDetails(sale)}>
                        Ver Detalhes
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderFinancial = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Módulo Financeiro</h2>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Receitas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R${" "}
              {transactions
                .filter((t) => t.type === "receita")
                .reduce((sum, t) => sum + t.amount, 0)
                .toLocaleString("pt-BR")}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Despesas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              R${" "}
              {transactions
                .filter((t) => t.type === "despesa")
                .reduce((sum, t) => sum + t.amount, 0)
                .toLocaleString("pt-BR")}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Lucro</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R${" "}
              {(
                transactions.filter((t) => t.type === "receita").reduce((sum, t) => sum + t.amount, 0) -
                transactions.filter((t) => t.type === "despesa").reduce((sum, t) => sum + t.amount, 0)
              ).toLocaleString("pt-BR")}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">A Receber</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R${" "}
              {transactions
                .filter((t) => t.status === "pendente" && t.type === "receita")
                .reduce((sum, t) => sum + t.amount, 0)
                .toLocaleString("pt-BR")}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transações Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Data</th>
                  <th className="text-left p-2">Descrição</th>
                  <th className="text-left p-2">Tipo</th>
                  <th className="text-left p-2">Valor</th>
                  <th className="text-left p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr key={transaction.id} className="border-b">
                    <td className="p-2">{transaction.date}</td>
                    <td className="p-2">{transaction.description}</td>
                    <td className="p-2">
                      <Badge variant={transaction.type === "receita" ? "default" : "secondary"}>
                        {transaction.type}
                      </Badge>
                    </td>
                    <td
                      className={`p-2 font-medium ${transaction.type === "receita" ? "text-green-600" : "text-red-600"}`}
                    >
                      {transaction.type === "receita" ? "+" : "-"}R$ {transaction.amount.toLocaleString("pt-BR")}
                    </td>
                    <td className="p-2">
                      <Badge variant={transaction.status === "pago" ? "default" : "secondary"}>
                        {transaction.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderCustomers = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gestão de Clientes</h2>
        <Button onClick={() => setShowAddCustomer(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Cliente
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Clientes Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customers.filter((c) => c.status === "ativo").length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Receita Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {customers.reduce((sum, c) => sum + c.totalPurchases, 0).toLocaleString("pt-BR")}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Ticket Médio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {(customers.reduce((sum, c) => sum + c.totalPurchases, 0) / (customers.length || 1)).toLocaleString("pt-BR")}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Clientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Nome</th>
                  <th className="text-left p-2">Email</th>
                  <th className="text-left p-2">Telefone</th>
                  <th className="text-left p-2">Total Compras</th>
                  <th className="text-left p-2">Última Compra</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Ações</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr key={customer.id} className="border-b">
                    <td className="p-2 font-medium">{customer.name}</td>
                    <td className="p-2">{customer.email}</td>
                    <td className="p-2">{customer.phone}</td>
                    <td className="p-2">R$ {customer.totalPurchases.toLocaleString("pt-BR")}</td>
                    <td className="p-2">{customer.lastPurchase}</td>
                    <td className="p-2">
                      <Badge variant={customer.status === "ativo" ? "default" : "secondary"}>{customer.status}</Badge>
                    </td>
                    <td className="p-2">
                      <Button variant="outline" size="sm" onClick={() => viewCustomerDetails(customer)}>
                        Ver Detalhes
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderReports = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Sistema de Relatórios</h2>
          <p className="text-muted-foreground">Análises e relatórios gerenciais completos</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportToPDF} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar PDF
          </Button>
          <Button onClick={exportToExcel} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar Excel
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros de Relatório</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Tipo de Relatório</Label>
              <Select defaultValue="vendas">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vendas">Vendas</SelectItem>
                  <SelectItem value="financeiro">Financeiro</SelectItem>
                  <SelectItem value="estoque">Estoque</SelectItem>
                  <SelectItem value="clientes">Clientes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Data Inicial</Label>
              <Input type="date" defaultValue="2024-01-01" />
            </div>
            <div>
              <Label>Data Final</Label>
              <Input type="date" defaultValue="2024-01-31" />
            </div>
            <div>
              <Label>Categoria</Label>
              <Select defaultValue="todas">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  <SelectItem value="eletronicos">Eletrônicos</SelectItem>
                  <SelectItem value="acessorios">Acessórios</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Total de Vendas</CardTitle>
            <CardDescription>Resumo das vendas no período</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">R$ {dashboardMetrics.totalRevenue.toLocaleString("pt-BR")}</div>
            <p className="text-sm text-muted-foreground">{dashboardMetrics.totalSales} transações</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ticket Médio</CardTitle>
            <CardDescription>Valor médio por transação</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">R$ {dashboardMetrics.averageTicket.toLocaleString("pt-BR")}</div>
            <p className="text-sm text-muted-foreground">Por transação</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detalhes das Vendas no Período</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Data</th>
                  <th className="text-left p-2">Cliente</th>
                  <th className="text-left p-2">Valor</th>
                  <th className="text-left p-2">Pagamento</th>
                  <th className="text-left p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((sale) => (
                  <tr key={sale.id} className="border-b">
                    <td className="p-2">{sale.date}</td>
                    <td className="p-2 font-medium">{sale.customer}</td>
                    <td className="p-2">R$ {sale.total.toLocaleString("pt-BR")}</td>
                    <td className="p-2">{sale.paymentMethod}</td>
                    <td className="p-2">
                      <Badge
                        variant={
                          sale.status === "paga" ? "default" : sale.status === "pendente" ? "secondary" : "destructive"
                        }
                      >
                        {sale.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderContent = () => {
    switch (activeModule) {
      case "dashboard":
        return renderDashboard()
      case "inventory":
        return renderInventory()
      case "sales":
        return renderSales()
      case "financial":
        return renderFinancial()
      case "customers":
        return renderCustomers()
      case "reports":
        return renderReports()
      default:
        return renderDashboard()
    }
  }

  return (
    <div className={`min-h-screen ${settings.darkMode ? "dark bg-gray-900 text-white" : "bg-gray-50"}`}>
      <div className="flex">
        <aside
          // Passo 4: Correção da sintaxe do className
          className={`w-64 ${settings.darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"} border-r flex flex-col`}
        >
          <nav className="flex-1 px-4 py-6 space-y-2">
            {[
              { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
              { id: "inventory", label: "Estoque", icon: Package },
              { id: "sales", label: "Vendas", icon: ShoppingCart },
              { id: "financial", label: "Financeiro", icon: DollarSign },
              { id: "customers", label: "Clientes", icon: Users },
              { id: "reports", label: "Relatórios", icon: FileText },
            ].map((item) => {
              const Icon = item.icon
              const isActive = activeModule === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveModule(item.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                    isActive
                      ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/25"
                      : settings.darkMode
                        ? "text-gray-300 hover:bg-gray-700 hover:text-white"
                        : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              )
            })}
          </nav>

          {/* Status do sistema melhorado */}
          <div className={`px-4 py-4 border-t ${settings.darkMode ? "border-gray-700" : "border-gray-200"}`}>
            <h3 className={`text-sm font-semibold mb-3 ${settings.darkMode ? "text-gray-300" : "text-gray-700"}`}>
              Status do Sistema
            </h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className={`text-sm ${settings.darkMode ? "text-gray-400" : "text-gray-600"}`}>
                  Sistema Online
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className={`w-3 h-3 ${settings.darkMode ? "text-gray-400" : "text-gray-500"}`} />
                {/* Passo 5.1: Atualização da Sidebar com dados dinâmicos */}
                <span className={`text-sm ${settings.darkMode ? "text-gray-400" : "text-gray-600"}`}>
                  Último backup: {lastBackup}
                </span>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1">
          <header
            className={`${settings.darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"} border-b px-6 py-4`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {/* Logo profissional */}
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-lg">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                        />
                      </svg>
                    </div>
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white"></div>
                  </div>
                  <div>
                    <h1 className={`text-xl font-bold ${settings.darkMode ? "text-white" : "text-gray-900"}`}>
                      ERP System
                    </h1>
                    <p className={`text-sm ${settings.darkMode ? "text-gray-400" : "text-gray-500"}`}>
                      Gestão Empresarial
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                {/* Barra de busca melhorada */}
                <div className="relative">
                  <Search
                    className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${settings.darkMode ? "text-gray-400" : "text-gray-500"}`}
                  />
                  <input
                    type="text"
                    placeholder="Buscar..."
                    className={`pl-10 pr-4 py-2 w-80 rounded-lg border ${
                      settings.darkMode
                        ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-emerald-500"
                        : "bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500 focus:border-emerald-500"
                    } focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all`}
                  />
                </div>

                {/* Botões de ação melhorados */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowNotifications(true)}
                    className={`relative p-2 rounded-lg transition-colors ${
                      settings.darkMode
                        ? "hover:bg-gray-700 text-gray-300 hover:text-white"
                        : "hover:bg-gray-100 text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    <Bell className="w-5 h-5" />
                    {notifications.filter((n) => !n.read).length > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                        {notifications.filter((n) => !n.read).length}
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => setShowSettings(true)}
                    className={`p-2 rounded-lg transition-colors ${
                      settings.darkMode
                        ? "hover:bg-gray-700 text-gray-300 hover:text-white"
                        : "hover:bg-gray-100 text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    <Settings className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </header>

          {/* Content */}
          <main className="p-6">{renderContent()}</main>

          {/* Modals */}
          <div>
            {/* Settings Modal */}
            <Dialog open={showSettings} onOpenChange={setShowSettings}>
              <DialogContent
                className={`max-w-2xl max-h-[90vh] overflow-y-auto ${settings.darkMode ? "bg-gray-800 text-white border-gray-700" : ""}`}
              >
                <DialogHeader>
                  <DialogTitle>Configurações do Sistema</DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Configurações Gerais</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label>Tema Escuro</Label>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSettingChange("darkMode", !settings.darkMode)}
                          className={settings.darkMode ? "border-gray-600 hover:bg-gray-700" : ""}
                        >
                          {settings.darkMode ? "Desativar" : "Ativar"}
                        </Button>
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Notificações por Email</Label>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSettingChange("emailNotifications", !settings.emailNotifications)}
                          className={settings.darkMode ? "border-gray-600 hover:bg-gray-700" : ""}
                        >
                          {settings.emailNotifications ? "Ativado" : "Desativado"}
                        </Button>
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Backup Automático</Label>
                        <Select
                          value={settings.autoBackup}
                          onValueChange={(value) => handleSettingChange("autoBackup", value)}
                        >
                          <SelectTrigger className={`w-32 ${settings.darkMode ? "bg-gray-700 border-gray-600" : ""}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className={settings.darkMode ? "bg-gray-700 border-gray-600" : ""}>
                            <SelectItem value="diario">Diário</SelectItem>
                            <SelectItem value="semanal">Semanal</SelectItem>
                            <SelectItem value="mensal">Mensal</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-4">Dados da Empresa</h3>
                    <div className="space-y-4">
                      <div>
                        <Label>Nome da Empresa</Label>
                        <Input
                          value={settings.companyName}
                          onChange={(e) => handleSettingChange("companyName", e.target.value)}
                          className={settings.darkMode ? "bg-gray-700 border-gray-600" : ""}
                        />
                      </div>
                      <div>
                        <Label>CNPJ</Label>
                        <Input
                          value={settings.cnpj}
                          onChange={(e) => handleSettingChange("cnpj", e.target.value)}
                          className={settings.darkMode ? "bg-gray-700 border-gray-600" : ""}
                        />
                      </div>
                      <div>
                        <Label>Email</Label>
                        <Input
                          value={settings.email}
                          onChange={(e) => handleSettingChange("email", e.target.value)}
                          className={settings.darkMode ? "bg-gray-700 border-gray-600" : ""}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-4">Sistema</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Versão do Sistema</span>
                        <span className="font-medium">v2.1.0</span>
                      </div>
                      {/* Passo 5.2: Atualização do Modal com dados dinâmicos */}
                      <div className="flex justify-between">
                        <span>Último Backup</span>
                        <span className="font-medium">{lastBackup}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Próximo Backup Agendado</span>
                        <span className="font-medium">{nextBackup}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Usuários Ativos</span>
                        <span className="font-medium">3</span>
                      </div>
                    </div>
                  </div>

                  <div className="sticky bottom-0 bg-inherit pt-4 border-t flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={cancelSettings}
                      className={settings.darkMode ? "border-gray-600 hover:bg-gray-700" : ""}
                    >
                      Cancelar
                    </Button>
                    <Button onClick={saveSettings}>Salvar Alterações</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Notifications Modal */}
            <Dialog open={showNotifications} onOpenChange={setShowNotifications}>
              <DialogContent
                className={`max-w-md ${settings.darkMode ? "bg-gray-800 text-white border-gray-700" : ""}`}
              >
                <DialogHeader>
                  <DialogTitle>Notificações</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 rounded-lg border cursor-pointer ${
                        notification.read
                          ? settings.darkMode
                            ? "bg-gray-700 border-gray-600"
                            : "bg-gray-50"
                          : settings.darkMode
                            ? "bg-gray-600 border-gray-500"
                            : "bg-blue-50 border-blue-200"
                      }`}
                      onClick={() => markNotificationAsRead(notification.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{notification.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                          <p className="text-xs text-gray-400 mt-2">{notification.date}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {notification.type === "warning" && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
                          {notification.type === "success" && <CheckCircle className="h-4 w-4 text-green-500" />}
                          {notification.type === "info" && <Clock className="h-4 w-4 text-blue-500" />}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeNotification(notification.id)}
                            className={`h-6 w-6 p-0 ${settings.darkMode ? "hover:bg-gray-600" : "hover:bg-gray-200"}`}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {notifications.length === 0 && (
                    <div className="text-center py-8 text-gray-500">Nenhuma notificação</div>
                  )}
                </div>
              </DialogContent>
            </Dialog>

            {/* Add Product Modal */}
            <Dialog open={showAddProduct} onOpenChange={setShowAddProduct}>
              <DialogContent
                className={`max-w-md ${settings.darkMode ? "bg-gray-800 text-white border-gray-700" : ""}`}
              >
                <DialogHeader>
                  <DialogTitle>Adicionar Produto</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Nome do Produto</Label>
                    <Input
                      value={newProduct.name}
                      onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                      className={settings.darkMode ? "bg-gray-700 border-gray-600" : ""}
                    />
                  </div>
                  <div>
                    <Label>Categoria</Label>
                    <Select
                      value={newProduct.category}
                      onValueChange={(value) => setNewProduct({ ...newProduct, category: value })}
                    >
                      <SelectTrigger className={settings.darkMode ? "bg-gray-700 border-gray-600" : ""}>
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                      <SelectContent className={settings.darkMode ? "bg-gray-700 border-gray-600" : ""}>
                        <SelectItem value="eletrônicos">Eletrônicos</SelectItem>
                        <SelectItem value="acessórios">Acessórios</SelectItem>
                        <SelectItem value="móveis">Móveis</SelectItem>
                        <SelectItem value="roupas">Roupas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Quantidade</Label>
                    <Input
                      type="number"
                      value={newProduct.quantity}
                      onChange={(e) => setNewProduct({ ...newProduct, quantity: Number.parseInt(e.target.value) || 0 })}
                      className={settings.darkMode ? "bg-gray-700 border-gray-600" : ""}
                    />
                  </div>
                  <div>
                    <Label>Preço (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={newProduct.price}
                      onChange={(e) => setNewProduct({ ...newProduct, price: Number.parseFloat(e.target.value) || 0 })}
                      className={settings.darkMode ? "bg-gray-700 border-gray-600" : ""}
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setShowAddProduct(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={addProduct}>Adicionar</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Add Sale Modal */}
            <Dialog open={showAddSale} onOpenChange={setShowAddSale}>
              <DialogContent
                className={`max-w-md ${settings.darkMode ? "bg-gray-800 text-white border-gray-700" : ""}`}
              >
                <DialogHeader>
                  <DialogTitle>Nova Venda</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Cliente</Label>
                    <Input
                      value={newSale.customer}
                      onChange={(e) => setNewSale({ ...newSale, customer: e.target.value })}
                      className={settings.darkMode ? "bg-gray-700 border-gray-600" : ""}
                    />
                  </div>
                  <div>
                    <Label>Valor Total (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={newSale.total}
                      onChange={(e) => setNewSale({ ...newSale, total: Number.parseFloat(e.target.value) || 0 })}
                      className={settings.darkMode ? "bg-gray-700 border-gray-600" : ""}
                    />
                  </div>
                  <div>
                    <Label>Forma de Pagamento</Label>
                    <Select
                      value={newSale.payment}
                      onValueChange={(value) => setNewSale({ ...newSale, payment: value })}
                    >
                      <SelectTrigger className={settings.darkMode ? "bg-gray-700 border-gray-600" : ""}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className={settings.darkMode ? "bg-gray-700 border-gray-600" : ""}>
                        <SelectItem value="dinheiro">Dinheiro</SelectItem>
                        <SelectItem value="cartao">Cartão de Crédito</SelectItem>
                        <SelectItem value="pix">PIX</SelectItem>
                        <SelectItem value="transferencia">Transferência</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setShowAddSale(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={addSale}>Criar Venda</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Add Customer Modal */}
            <Dialog open={showAddCustomer} onOpenChange={setShowAddCustomer}>
              <DialogContent
                className={`max-w-md ${settings.darkMode ? "bg-gray-800 text-white border-gray-700" : ""}`}
              >
                <DialogHeader>
                  <DialogTitle>Novo Cliente</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Nome</Label>
                    <Input
                      value={newCustomer.name}
                      onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                      className={settings.darkMode ? "bg-gray-700 border-gray-600" : ""}
                    />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={newCustomer.email}
                      onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                      className={settings.darkMode ? "bg-gray-700 border-gray-600" : ""}
                    />
                  </div>
                  <div>
                    <Label>Telefone</Label>
                    <Input
                      value={newCustomer.phone}
                      onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                      className={settings.darkMode ? "bg-gray-700 border-gray-600" : ""}
                    />
                  </div>
                  <div>
                    <Label>Endereço</Label>
                    <Input
                      value={newCustomer.address}
                      onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                      className={settings.darkMode ? "bg-gray-700 border-gray-600" : ""}
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setShowAddCustomer(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={addCustomer}>Adicionar Cliente</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={showSaleDetails} onOpenChange={setShowSaleDetails}>
              <DialogContent
                className={`max-w-md ${settings.darkMode ? "bg-gray-800 text-white border-gray-700" : ""}`}
              >
                <DialogHeader>
                  <DialogTitle>Detalhes da Venda</DialogTitle>
                </DialogHeader>
                {selectedSale && (
                  <div className="space-y-4">
                    <div>
                      <Label>Data</Label>
                      <p className="text-sm font-medium">{selectedSale.date}</p>
                    </div>
                    <div>
                      <Label>Cliente</Label>
                      <p className="text-sm font-medium">{selectedSale.customer}</p>
                    </div>
                    <div>
                      <Label>Valor Total</Label>
                      <p className="text-sm font-medium">R$ {selectedSale.total.toLocaleString("pt-BR")}</p>
                    </div>
                    <div>
                      <Label>Forma de Pagamento</Label>
                      <p className="text-sm font-medium">{selectedSale.paymentMethod}</p>
                    </div>
                    <div>
                      <Label>Status</Label>
                      <Badge variant={selectedSale.status === "paga" ? "default" : "secondary"}>
                        {selectedSale.status}
                      </Badge>
                    </div>
                    <div className="flex justify-end">
                      <Button onClick={() => setShowSaleDetails(false)}>Fechar</Button>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>

            <Dialog open={showCustomerDetails} onOpenChange={setShowCustomerDetails}>
              <DialogContent
                className={`max-w-md ${settings.darkMode ? "bg-gray-800 text-white border-gray-700" : ""}`}
              >
                <DialogHeader>
                  <DialogTitle>Detalhes do Cliente</DialogTitle>
                </DialogHeader>
                {selectedCustomer && (
                  <div className="space-y-4">
                    <div>
                      <Label>Nome</Label>
                      <p className="text-sm font-medium">{selectedCustomer.name}</p>
                    </div>
                    <div>
                      <Label>Email</Label>
                      <p className="text-sm font-medium">{selectedCustomer.email}</p>
                    </div>
                    <div>
                      <Label>Telefone</Label>
                      <p className="text-sm font-medium">{selectedCustomer.phone}</p>
                    </div>
                    <div>
                      <Label>Endereço</Label>
                      <p className="text-sm font-medium">{selectedCustomer.address}</p>
                    </div>
                    <div>
                      <Label>Total de Compras</Label>
                      <p className="text-sm font-medium">
                        R$ {selectedCustomer.totalPurchases.toLocaleString("pt-BR")}
                      </p>
                    </div>
                    <div>
                      <Label>Última Compra</Label>
                      <p className="text-sm font-medium">{selectedCustomer.lastPurchase}</p>
                    </div>
                    <div>
                      <Label>Status</Label>
                      <Badge variant={selectedCustomer.status === "ativo" ? "default" : "secondary"}>
                        {selectedCustomer.status}
                      </Badge>
                    </div>
                    <div className="flex justify-end">
                      <Button onClick={() => setShowCustomerDetails(false)}>Fechar</Button>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>

            <Dialog open={showEditProduct} onOpenChange={setShowEditProduct}>
              <DialogContent
                className={`max-w-md ${settings.darkMode ? "bg-gray-800 text-white border-gray-700" : ""}`}
              >
                <DialogHeader>
                  <DialogTitle>Editar Produto</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Nome do Produto</Label>
                    <Input
                      value={editingProduct.name}
                      onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                      className={settings.darkMode ? "bg-gray-700 border-gray-600" : ""}
                    />
                  </div>
                  <div>
                    <Label>Categoria</Label>
                    <Select
                      value={editingProduct.category}
                      onValueChange={(value) => setEditingProduct({ ...editingProduct, category: value })}
                    >
                      <SelectTrigger className={settings.darkMode ? "bg-gray-700 border-gray-600" : ""}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className={settings.darkMode ? "bg-gray-700 border-gray-600" : ""}>
                        <SelectItem value="eletrônicos">Eletrônicos</SelectItem>
                        <SelectItem value="acessórios">Acessórios</SelectItem>
                        <SelectItem value="móveis">Móveis</SelectItem>
                        <SelectItem value="roupas">Roupas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Quantidade</Label>
                    <Input
                      type="number"
                      value={editingProduct.quantity}
                      onChange={(e) =>
                        setEditingProduct({ ...editingProduct, quantity: Number.parseInt(e.target.value) || 0 })
                      }
                      className={settings.darkMode ? "bg-gray-700 border-gray-600" : ""}
                    />
                  </div>
                  <div>
                    <Label>Preço (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={editingProduct.price}
                      onChange={(e) =>
                        setEditingProduct({ ...editingProduct, price: Number.parseFloat(e.target.value) || 0 })
                      }
                      className={settings.darkMode ? "bg-gray-700 border-gray-600" : ""}
                    />
                  </div>
                  <div className="flex justify-between">
                    <Button variant="destructive" onClick={deleteProduct}>
                      Excluir Produto
                    </Button>
                    <div className="space-x-2">
                      <Button variant="outline" onClick={() => setShowEditProduct(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={updateProduct}>Salvar Alterações</Button>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </div>
  )
}