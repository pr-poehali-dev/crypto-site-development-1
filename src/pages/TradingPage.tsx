import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';

const TRADING_API = 'https://functions.poehali.dev/33e371c1-fb58-4d19-98df-0c919b65223c';
const LOTTERY_API = 'https://functions.poehali.dev/f1935aa4-18f9-404c-b1b6-a7205459af6a';

interface Transaction {
  id: number;
  type: 'buy' | 'sell';
  amount: number;
  price: number;
  commission: number;
  timestamp: string;
  user: string;
}

interface Lottery {
  id: number;
  prize: number;
  active: boolean;
  participantCount: number;
}

interface TradingPageProps {
  userId: number;
  username: string;
  onLogout: () => void;
}

export default function TradingPage({ userId, username, onLogout }: TradingPageProps) {
  const [price, setPrice] = useState(42.50);
  const [commission, setCommission] = useState(0);
  const [cryptoBalance, setCryptoBalance] = useState(0);
  const [amount, setAmount] = useState('');
  const [signature, setSignature] = useState('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [lotteries, setLotteries] = useState<Lottery[]>([]);
  const [loading, setLoading] = useState(false);
  const [clicks, setClicks] = useState(0);
  const [isClicking, setIsClicking] = useState(false);

  useEffect(() => {
    loadData();
    const transactionsInterval = setInterval(loadTransactions, 5000);
    const balanceInterval = setInterval(loadBalance, 3000);
    const priceInterval = setInterval(loadPrice, 5000);
    const lotteriesInterval = setInterval(loadLotteries, 10000);
    return () => {
      clearInterval(transactionsInterval);
      clearInterval(balanceInterval);
      clearInterval(priceInterval);
      clearInterval(lotteriesInterval);
    };
  }, []);

  const loadData = async () => {
    await Promise.all([
      loadPrice(),
      loadBalance(),
      loadTransactions(),
      loadLotteries()
    ]);
  };

  const loadPrice = async () => {
    try {
      const response = await fetch(`${TRADING_API}?action=price`);
      const data = await response.json();
      setPrice(data.price);
      setCommission(data.commission);
    } catch (error) {
      console.error('Error loading price:', error);
    }
  };

  const loadBalance = async () => {
    try {
      const response = await fetch(`${TRADING_API}?action=balance&userId=${userId}`);
      const data = await response.json();
      setCryptoBalance(data.cryptoBalance);
    } catch (error) {
      console.error('Error loading balance:', error);
    }
  };

  const loadTransactions = async () => {
    try {
      const response = await fetch(`${TRADING_API}?action=transactions`);
      const data = await response.json();
      setTransactions(data.transactions);
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };

  const loadLotteries = async () => {
    try {
      const response = await fetch(LOTTERY_API);
      const data = await response.json();
      setLotteries(data.lotteries);
    } catch (error) {
      console.error('Error loading lotteries:', error);
    }
  };

  const handleBuyRequest = async () => {
    const amountNum = parseFloat(amount);
    if (!amountNum || amountNum <= 0) {
      toast.error('Введите корректное количество');
      return;
    }

    if (!signature.trim()) {
      toast.error('Введите вашу подпись');
      return;
    }

    setLoading(true);
    
    try {
      const response = await fetch(TRADING_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'purchase_request',
          userId,
          amount: amountNum,
          signature: signature.trim()
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка при создании заявки');
      }

      toast.success('Заявка на покупку отправлена! Ожидайте одобрения администратора');
      setAmount('');
      setSignature('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Ошибка соединения');
    } finally {
      setLoading(false);
    }
  };

  const handleSell = async () => {
    const amountNum = parseFloat(amount);
    if (!amountNum || amountNum <= 0) {
      toast.error('Введите корректное количество');
      return;
    }
    if (amountNum > cryptoBalance) {
      toast.error('Недостаточно криптовалюты');
      return;
    }

    setLoading(true);
    
    try {
      const response = await fetch(TRADING_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'sell',
          userId,
          amount: amountNum
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка при продаже');
      }

      const commissionAmount = data.commission || 0;
      const total = amountNum * price - commissionAmount;
      toast.success(`Продано ${amountNum} EE%A за ${total.toFixed(2)} ₽ (комиссия: ${commissionAmount.toFixed(2)} ₽)`);
      setAmount('');
      await loadBalance();
      await loadTransactions();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Ошибка соединения');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinLottery = async (lotteryId: number) => {
    try {
      const response = await fetch(LOTTERY_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lotteryId,
          userId
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка при участии');
      }

      toast.success('Вы участвуете в розыгрыше!');
      await loadLotteries();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Ошибка соединения');
    }
  };

  const total = parseFloat(amount) * price || 0;
  const commissionAmount = total * (commission / 100);

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              nEvE%rA
            </h1>
            <p className="text-muted-foreground">Привет, {username}!</p>
          </div>
          <Button 
            variant="ghost" 
            className="gap-2"
            onClick={onLogout}
          >
            <Icon name="LogOut" size={18} />
            Выйти
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-card border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Текущая цена</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold">{price.toFixed(2)} ₽</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Ваш баланс EE%A</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Icon name="Coins" size={20} className="text-secondary" />
                <span className="text-3xl font-bold">{cryptoBalance.toFixed(4)}</span>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="bg-gradient-to-br from-primary to-secondary cursor-pointer transition-transform hover:scale-105 active:scale-95"
            onClick={async () => {
              if (isClicking) return;
              setIsClicking(true);
              const newClicks = clicks + 1;
              setClicks(newClicks);
              const earned = newClicks * 0.02;
              
              try {
                const response = await fetch(TRADING_API, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    action: 'add_clicks',
                    userId,
                    amount: earned
                  })
                });
                if (response.ok) {
                  await loadBalance();
                }
              } catch (error) {
                console.error('Click error:', error);
              }
              
              setTimeout(() => setIsClicking(false), 100);
            }}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-white">Кликер</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-2">
                <div className="text-5xl">💎</div>
                <div className="text-white font-bold">
                  {clicks} кликов
                </div>
                <div className="text-xs text-white/80">
                  +{(clicks * 0.02).toFixed(4)} EE%A
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon name="ShoppingCart" size={20} />
                Купить криптовалюту
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Количество EE%A</Label>
                <Input 
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="bg-background"
                  disabled={loading}
                />
                {amount && !isNaN(parseFloat(amount)) && (
                  <div className="space-y-1 text-sm">
                    <p className="text-muted-foreground">
                      Цена: {total.toFixed(2)} ₽
                    </p>
                    {commission > 0 && (
                      <p className="text-muted-foreground">
                        Комиссия ({commission}%): {commissionAmount.toFixed(2)} ₽
                      </p>
                    )}
                    <p className="font-medium">
                      Итого: {(total + commissionAmount).toFixed(2)} ₽
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Ваша роспись</Label>
                <Textarea 
                  placeholder="Введите вашу подпись для подтверждения покупки..."
                  value={signature}
                  onChange={(e) => setSignature(e.target.value)}
                  className="bg-background min-h-24"
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">
                  Администратор рассмотрит вашу заявку и одобрит покупку
                </p>
              </div>

              <Button 
                onClick={handleBuyRequest}
                className="w-full bg-primary hover:bg-primary/90 gap-2"
                disabled={loading}
              >
                <Icon name="FileSignature" size={18} />
                Отправить заявку на покупку
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon name="TrendingDown" size={20} />
                Продать криптовалюту
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Количество EE%A</Label>
                <Input 
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="bg-background"
                  disabled={loading}
                />
                {amount && !isNaN(parseFloat(amount)) && (
                  <div className="space-y-1 text-sm">
                    <p className="text-muted-foreground">
                      Цена: {total.toFixed(2)} ₽
                    </p>
                    {commission > 0 && (
                      <p className="text-muted-foreground">
                        Комиссия ({commission}%): {commissionAmount.toFixed(2)} ₽
                      </p>
                    )}
                    <p className="font-medium">
                      Вы получите: {(total - commissionAmount).toFixed(2)} ₽
                    </p>
                  </div>
                )}
              </div>

              <Button 
                onClick={handleSell}
                variant="outline"
                className="w-full border-destructive text-destructive hover:bg-destructive hover:text-white gap-2"
                disabled={loading}
              >
                <Icon name="TrendingDown" size={18} />
                Продать
              </Button>

              <div className="pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Комиссия:</span>
                  <span>{commission}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Доступно:</span>
                  <span>{cryptoBalance.toFixed(4)} EE%A</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {lotteries.length > 0 && (
          <Card className="bg-card border-secondary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon name="Trophy" size={20} />
                Активные розыгрыши
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {lotteries.map(lottery => (
                  <div key={lottery.id} className="p-4 bg-background rounded-lg border border-border space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-lg text-secondary">Приз: {lottery.prize} EE%A</p>
                        <p className="text-sm text-muted-foreground">
                          Участников: {lottery.participantCount}
                        </p>
                      </div>
                      <Icon name="Gift" size={32} className="text-secondary" />
                    </div>
                    <Button 
                      onClick={() => handleJoinLottery(lottery.id)}
                      className="w-full gap-2 bg-secondary"
                    >
                      <Icon name="Ticket" size={18} />
                      Участвовать
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon name="History" size={20} />
              История транзакций
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {transactions.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">Нет транзакций</p>
              ) : (
                transactions.map(tx => (
                  <div 
                    key={tx.id} 
                    className="flex items-center justify-between p-3 bg-background rounded-lg border border-border hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${tx.type === 'buy' ? 'bg-primary/20' : 'bg-destructive/20'}`}>
                        <Icon 
                          name={tx.type === 'buy' ? 'ArrowDownToLine' : 'ArrowUpFromLine'} 
                          size={18}
                          className={tx.type === 'buy' ? 'text-primary' : 'text-destructive'}
                        />
                      </div>
                      <div>
                        <p className="font-medium">
                          {tx.type === 'buy' ? 'Покупка' : 'Продажа'} {tx.amount.toFixed(4)} EE%A
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {tx.user} • {new Date(tx.timestamp).toLocaleString('ru-RU')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">
                        @ {tx.price.toFixed(2)} ₽
                      </p>
                      {tx.commission > 0 && (
                        <p className="text-xs text-muted-foreground">
                          комиссия: {tx.commission.toFixed(2)} ₽
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}