import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const ADMIN_API = 'https://functions.poehali.dev/9c029e11-2967-4277-9d91-17aece5c7c23';
const ADMIN_PASSWORD = 'EE%adminA%%';

interface User {
  id: number;
  name: string;
  cryptoBalance: number;
}

interface Promotion {
  id: number;
  title: string;
  description: string;
  discount: number;
  active: boolean;
}

interface Lottery {
  id: number;
  prize: number;
  winnerId?: number;
  winner?: string;
  active: boolean;
  participantCount: number;
}

interface PurchaseRequest {
  id: number;
  userId: number;
  username: string;
  amount: number;
  price: number;
  signature: string;
  status: string;
  createdAt: string;
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [currentPrice, setCurrentPrice] = useState('42.50');
  const [commission, setCommission] = useState('0');
  const [users, setUsers] = useState<User[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [lotteries, setLotteries] = useState<Lottery[]>([]);
  const [purchaseRequests, setPurchaseRequests] = useState<PurchaseRequest[]>([]);
  const [newPromo, setNewPromo] = useState({ title: '', description: '', discount: '' });
  const [newLottery, setNewLottery] = useState({ prize: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
      const interval = setInterval(loadPurchaseRequests, 3000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const loadData = async () => {
    await Promise.all([
      loadUsers(),
      loadPromotions(),
      loadLotteries(),
      loadPurchaseRequests()
    ]);
  };

  const apiCall = async (action: string, method: string = 'GET', body?: any) => {
    const url = method === 'GET' ? `${ADMIN_API}?action=${action}` : ADMIN_API;
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Password': ADMIN_PASSWORD
      },
      ...(body && { body: JSON.stringify(body) })
    });
    return response.json();
  };

  const loadUsers = async () => {
    try {
      const data = await apiCall('users');
      setUsers(data.users || []);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadPromotions = async () => {
    try {
      const data = await apiCall('promotions');
      setPromotions(data.promotions || []);
    } catch (error) {
      console.error('Error loading promotions:', error);
    }
  };

  const loadLotteries = async () => {
    try {
      const data = await apiCall('lotteries');
      setLotteries(data.lotteries || []);
    } catch (error) {
      console.error('Error loading lotteries:', error);
    }
  };

  const loadPurchaseRequests = async () => {
    try {
      const data = await apiCall('purchase_requests');
      setPurchaseRequests(data.requests || []);
    } catch (error) {
      console.error('Error loading purchase requests:', error);
    }
  };

  const handleLogin = () => {
    if (passwordInput === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      toast.success('Добро пожаловать в админ-панель');
    } else {
      toast.error('Неверный пароль');
    }
  };

  const handlePriceChange = async () => {
    setLoading(true);
    try {
      await apiCall('', 'POST', { action: 'set_price', price: currentPrice });
      toast.success('Цена обновлена');
    } catch (error) {
      toast.error('Ошибка при обновлении цены');
    } finally {
      setLoading(false);
    }
  };

  const handleCommissionChange = async () => {
    setLoading(true);
    try {
      await apiCall('', 'POST', { action: 'set_commission', commission });
      toast.success('Комиссия обновлена');
    } catch (error) {
      toast.error('Ошибка при обновлении комиссии');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePromo = async () => {
    if (!newPromo.title || !newPromo.discount) {
      toast.error('Заполните все поля');
      return;
    }
    setLoading(true);
    try {
      await apiCall('', 'POST', { 
        action: 'create_promotion',
        title: newPromo.title,
        description: newPromo.description,
        discount: newPromo.discount
      });
      toast.success('Акция создана');
      setNewPromo({ title: '', description: '', discount: '' });
      await loadPromotions();
    } catch (error) {
      toast.error('Ошибка при создании акции');
    } finally {
      setLoading(false);
    }
  };

  const togglePromo = async (promoId: number) => {
    try {
      await apiCall('', 'POST', { action: 'toggle_promotion', promoId });
      await loadPromotions();
    } catch (error) {
      toast.error('Ошибка');
    }
  };

  const handleCreateLottery = async () => {
    const prize = parseFloat(newLottery.prize);
    if (!prize || prize <= 0) {
      toast.error('Введите корректный приз');
      return;
    }
    setLoading(true);
    try {
      await apiCall('', 'POST', { action: 'create_lottery', prize });
      toast.success('Розыгрыш создан');
      setNewLottery({ prize: '' });
      await loadLotteries();
    } catch (error) {
      toast.error('Ошибка при создании розыгрыша');
    } finally {
      setLoading(false);
    }
  };

  const handleDrawWinner = async (lotteryId: number) => {
    setLoading(true);
    try {
      const data = await apiCall('', 'POST', { action: 'draw_winner', lotteryId });
      toast.success(`Победитель: ${data.winner}`);
      await loadLotteries();
    } catch (error: any) {
      toast.error(error.message || 'Ошибка при розыгрыше');
    } finally {
      setLoading(false);
    }
  };

  const handleApprovePurchase = async (requestId: number, approved: boolean) => {
    setLoading(true);
    try {
      await apiCall('', 'POST', { action: 'approve_purchase', requestId, approved });
      toast.success(approved ? 'Покупка одобрена' : 'Покупка отклонена');
      await loadPurchaseRequests();
      await loadUsers();
    } catch (error) {
      toast.error('Ошибка');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveCrypto = async (userId: number, amount: string) => {
    const amountNum = parseFloat(amount);
    if (!amountNum || amountNum <= 0) {
      toast.error('Введите корректное количество');
      return;
    }
    try {
      await apiCall('', 'POST', { action: 'remove_crypto', userId, amount: amountNum });
      toast.success('Криптовалюта удалена');
      await loadUsers();
    } catch (error) {
      toast.error('Ошибка');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-card border-primary/20">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
              <Icon name="Lock" size={32} className="text-primary" />
            </div>
            <CardTitle className="text-2xl">Админ-панель</CardTitle>
            <p className="text-muted-foreground">nEvE%rA (EE%A)</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Пароль</Label>
              <Input 
                type="password"
                placeholder="Введите пароль"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                className="bg-background"
              />
            </div>
            <Button onClick={handleLogin} className="w-full bg-primary hover:bg-primary/90">
              <Icon name="LogIn" size={18} className="mr-2" />
              Войти
            </Button>
            <Button 
              variant="ghost" 
              className="w-full"
              onClick={() => window.location.href = '/'}
            >
              Вернуться на биржу
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Админ-панель
            </h1>
            <p className="text-muted-foreground">nEvE%rA (EE%A) управление</p>
          </div>
          <Button 
            variant="outline"
            onClick={() => window.location.href = '/'}
            className="gap-2"
          >
            <Icon name="ArrowLeft" size={18} />
            Биржа
          </Button>
        </div>

        <Card className="bg-card border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon name="Settings" size={20} />
              Настройки
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label>Цена криптовалюты (₽)</Label>
                <div className="flex gap-2 mt-2">
                  <Input 
                    type="number"
                    value={currentPrice}
                    onChange={(e) => setCurrentPrice(e.target.value)}
                    className="bg-background"
                  />
                  <Button onClick={handlePriceChange} disabled={loading}>
                    Установить
                  </Button>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <Label>Комиссия (%)</Label>
                <div className="flex gap-2 mt-2">
                  <Input 
                    type="number"
                    value={commission}
                    onChange={(e) => setCommission(e.target.value)}
                    className="bg-background"
                  />
                  <Button onClick={handleCommissionChange} disabled={loading}>
                    Установить
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {purchaseRequests.length > 0 && (
          <Card className="bg-card border-yellow-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon name="FileText" size={20} />
                Заявки на покупку ({purchaseRequests.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {purchaseRequests.map(req => (
                <div key={req.id} className="p-4 bg-background rounded-lg border border-border space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold">{req.username}</p>
                      <p className="text-sm text-muted-foreground">
                        {req.amount} EE%A × {req.price} ₽ = {(req.amount * req.price).toFixed(2)} ₽
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(req.createdAt).toLocaleString('ru-RU')}
                      </p>
                    </div>
                    <Badge>Ожидает</Badge>
                  </div>
                  <div className="p-3 bg-muted rounded text-sm">
                    <p className="text-xs text-muted-foreground mb-1">Подпись:</p>
                    <p className="whitespace-pre-wrap">{req.signature}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => handleApprovePurchase(req.id, true)}
                      className="flex-1 bg-success"
                      disabled={loading}
                    >
                      <Icon name="Check" size={18} className="mr-2" />
                      Одобрить
                    </Button>
                    <Button 
                      onClick={() => handleApprovePurchase(req.id, false)}
                      variant="destructive"
                      className="flex-1"
                      disabled={loading}
                    >
                      <Icon name="X" size={18} className="mr-2" />
                      Отклонить
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon name="Tag" size={20} />
                Акции
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {promotions.map(promo => (
                  <div key={promo.id} className="flex items-center justify-between p-3 bg-background rounded-lg border border-border">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{promo.title}</p>
                        <Badge variant={promo.active ? "default" : "secondary"}>
                          {promo.active ? 'Активна' : 'Неактивна'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{promo.description}</p>
                      <p className="text-sm text-primary">Скидка: +{promo.discount}% к покупке</p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => togglePromo(promo.id)}
                    >
                      <Icon name={promo.active ? "Pause" : "Play"} size={16} />
                    </Button>
                  </div>
                ))}
              </div>

              <Dialog>
                <DialogTrigger asChild>
                  <Button className="w-full gap-2 bg-primary">
                    <Icon name="Plus" size={18} />
                    Создать акцию
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-card">
                  <DialogHeader>
                    <DialogTitle>Новая акция</DialogTitle>
                    <DialogDescription>Клиент получит больше криптовалюты при покупке</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label>Название</Label>
                      <Input 
                        placeholder="Бонус +15%"
                        value={newPromo.title}
                        onChange={(e) => setNewPromo({...newPromo, title: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Описание</Label>
                      <Textarea 
                        placeholder="Получите на 15% больше криптовалюты..."
                        value={newPromo.description}
                        onChange={(e) => setNewPromo({...newPromo, description: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Бонус (%)</Label>
                      <Input 
                        type="number"
                        placeholder="15"
                        value={newPromo.discount}
                        onChange={(e) => setNewPromo({...newPromo, discount: e.target.value})}
                      />
                    </div>
                    <Button onClick={handleCreatePromo} className="w-full" disabled={loading}>
                      Создать
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          <Card className="bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon name="Trophy" size={20} />
                Жеребьевки
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {lotteries.map(lottery => (
                  <div key={lottery.id} className="p-3 bg-background rounded-lg border border-border space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Приз: {lottery.prize} EE%A</p>
                        <p className="text-sm text-muted-foreground">
                          Участников: {lottery.participantCount}
                        </p>
                      </div>
                      <Badge variant={lottery.active ? "default" : "secondary"}>
                        {lottery.active ? 'Активна' : 'Завершена'}
                      </Badge>
                    </div>
                    {lottery.winner && (
                      <div className="flex items-center gap-2 text-sm text-success">
                        <Icon name="Award" size={16} />
                        Победитель: {lottery.winner}
                      </div>
                    )}
                    {lottery.active && (
                      <Button 
                        onClick={() => handleDrawWinner(lottery.id)}
                        className="w-full gap-2"
                        size="sm"
                        disabled={loading}
                      >
                        <Icon name="Shuffle" size={16} />
                        Провести розыгрыш
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              <Dialog>
                <DialogTrigger asChild>
                  <Button className="w-full gap-2 bg-secondary">
                    <Icon name="Plus" size={18} />
                    Создать розыгрыш
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-card">
                  <DialogHeader>
                    <DialogTitle>Новый розыгрыш</DialogTitle>
                    <DialogDescription>Создайте розыгрыш криптовалюты</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label>Призовой фонд (EE%A)</Label>
                      <Input 
                        type="number"
                        placeholder="100"
                        value={newLottery.prize}
                        onChange={(e) => setNewLottery({prize: e.target.value})}
                      />
                    </div>
                    <Button onClick={handleCreateLottery} className="w-full" disabled={loading}>
                      Создать
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon name="Users" size={20} />
              Пользователи ({users.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {users.map(user => (
                <div 
                  key={user.id}
                  className="flex items-center justify-between p-4 bg-background rounded-lg border border-border"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                      <Icon name="User" size={20} className="text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-muted-foreground">
                        EE%A: {user.cryptoBalance.toFixed(4)}
                      </p>
                    </div>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Icon name="Minus" size={16} />
                        Забрать
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-card">
                      <DialogHeader>
                        <DialogTitle>Забрать криптовалюту</DialogTitle>
                        <DialogDescription>{user.name}</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 pt-4">
                        <div className="space-y-2">
                          <Label>Количество EE%A</Label>
                          <Input 
                            type="number"
                            placeholder={`Доступно: ${user.cryptoBalance.toFixed(4)}`}
                            id={`amount-${user.id}`}
                          />
                        </div>
                        <Button 
                          onClick={() => {
                            const input = document.getElementById(`amount-${user.id}`) as HTMLInputElement;
                            handleRemoveCrypto(user.id, input.value);
                          }}
                          variant="destructive"
                          className="w-full"
                        >
                          Забрать
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
