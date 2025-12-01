import { useState } from 'react';
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

interface User {
  id: string;
  name: string;
  balance: number;
  cryptoBalance: number;
}

interface Promotion {
  id: string;
  title: string;
  description: string;
  discount: number;
  active: boolean;
}

interface Lottery {
  id: string;
  prize: number;
  participants: string[];
  winner?: string;
  active: boolean;
}

const ADMIN_PASSWORD = 'EE%adminA%%';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [currentPrice, setCurrentPrice] = useState(42.50);
  const [newPrice, setNewPrice] = useState('');

  const [users] = useState<User[]>([
    { id: '1', name: 'Пользователь #1', balance: 1200, cryptoBalance: 15.5 },
    { id: '2', name: 'Пользователь #2', balance: 850, cryptoBalance: 32.1 },
    { id: '3', name: 'Пользователь #3', balance: 2100, cryptoBalance: 8.7 },
  ]);

  const [promotions, setPromotions] = useState<Promotion[]>([
    { id: '1', title: 'Скидка 10%', description: 'На первую покупку', discount: 10, active: true },
  ]);

  const [lotteries, setLotteries] = useState<Lottery[]>([
    { id: '1', prize: 100, participants: ['User1', 'User2', 'User3'], active: true },
  ]);

  const [newPromo, setNewPromo] = useState({ title: '', description: '', discount: '' });
  const [newLottery, setNewLottery] = useState({ prize: '' });

  const handleLogin = () => {
    if (passwordInput === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      toast.success('Добро пожаловать в админ-панель');
    } else {
      toast.error('Неверный пароль');
    }
  };

  const handlePriceChange = () => {
    const price = parseFloat(newPrice);
    if (!price || price <= 0) {
      toast.error('Введите корректную цену');
      return;
    }
    setCurrentPrice(price);
    setNewPrice('');
    toast.success(`Цена обновлена: ${price.toFixed(2)} ₽`);
  };

  const handleCreatePromo = () => {
    if (!newPromo.title || !newPromo.discount) {
      toast.error('Заполните все поля');
      return;
    }
    const promo: Promotion = {
      id: Date.now().toString(),
      title: newPromo.title,
      description: newPromo.description,
      discount: parseFloat(newPromo.discount),
      active: true
    };
    setPromotions([...promotions, promo]);
    setNewPromo({ title: '', description: '', discount: '' });
    toast.success('Акция создана');
  };

  const togglePromo = (id: string) => {
    setPromotions(promotions.map(p => 
      p.id === id ? { ...p, active: !p.active } : p
    ));
  };

  const handleCreateLottery = () => {
    const prize = parseFloat(newLottery.prize);
    if (!prize || prize <= 0) {
      toast.error('Введите корректный приз');
      return;
    }
    const lottery: Lottery = {
      id: Date.now().toString(),
      prize,
      participants: [],
      active: true
    };
    setLotteries([...lotteries, lottery]);
    setNewLottery({ prize: '' });
    toast.success('Розыгрыш создан');
  };

  const handleDrawWinner = (lotteryId: string) => {
    const lottery = lotteries.find(l => l.id === lotteryId);
    if (!lottery || lottery.participants.length === 0) {
      toast.error('Нет участников');
      return;
    }
    const winner = lottery.participants[Math.floor(Math.random() * lottery.participants.length)];
    setLotteries(lotteries.map(l => 
      l.id === lotteryId ? { ...l, winner, active: false } : l
    ));
    toast.success(`Победитель: ${winner}`);
  };

  const handleRemoveCrypto = (userId: string, amount: number) => {
    toast.success(`Удалено ${amount} EE%A у пользователя`);
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
              <Icon name="DollarSign" size={20} />
              Управление ценой
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Label>Текущая цена</Label>
                <div className="text-3xl font-bold text-primary mt-2">{currentPrice.toFixed(2)} ₽</div>
              </div>
              <div className="flex-1 space-y-2">
                <Label>Новая цена</Label>
                <div className="flex gap-2">
                  <Input 
                    type="number"
                    placeholder="0.00"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    className="bg-background"
                  />
                  <Button onClick={handlePriceChange} className="bg-primary">
                    Установить
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

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
                      <p className="text-sm text-primary">Скидка: {promo.discount}%</p>
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
                    <DialogDescription>Создайте новую акцию для пользователей</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label>Название</Label>
                      <Input 
                        placeholder="Скидка 15%"
                        value={newPromo.title}
                        onChange={(e) => setNewPromo({...newPromo, title: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Описание</Label>
                      <Textarea 
                        placeholder="Условия акции..."
                        value={newPromo.description}
                        onChange={(e) => setNewPromo({...newPromo, description: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Скидка (%)</Label>
                      <Input 
                        type="number"
                        placeholder="10"
                        value={newPromo.discount}
                        onChange={(e) => setNewPromo({...newPromo, discount: e.target.value})}
                      />
                    </div>
                    <Button onClick={handleCreatePromo} className="w-full">
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
                          Участников: {lottery.participants.length}
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
                    <Button onClick={handleCreateLottery} className="w-full">
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
              Пользователи
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
                      <div className="flex gap-4 text-sm text-muted-foreground">
                        <span>₽ {user.balance.toFixed(2)}</span>
                        <span>EE%A {user.cryptoBalance.toFixed(2)}</span>
                      </div>
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
                            placeholder={`Доступно: ${user.cryptoBalance.toFixed(2)}`}
                          />
                        </div>
                        <Button 
                          onClick={() => handleRemoveCrypto(user.id, user.cryptoBalance)}
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
