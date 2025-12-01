import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';

interface Transaction {
  id: string;
  type: 'buy' | 'sell';
  amount: number;
  price: number;
  timestamp: Date;
  user: string;
}

export default function TradingPage() {
  const [price, setPrice] = useState(42.50);
  const [balance, setBalance] = useState(1000);
  const [cryptoBalance, setCryptoBalance] = useState(25.5);
  const [amount, setAmount] = useState('');
  const [transactions, setTransactions] = useState<Transaction[]>([
    { id: '1', type: 'buy', amount: 10, price: 40.20, timestamp: new Date(Date.now() - 3600000), user: 'Вы' },
    { id: '2', type: 'sell', amount: 5, price: 41.80, timestamp: new Date(Date.now() - 7200000), user: 'Вы' },
    { id: '3', type: 'buy', amount: 15, price: 39.50, timestamp: new Date(Date.now() - 10800000), user: 'Вы' },
  ]);
  const [priceHistory, setPriceHistory] = useState<number[]>([38, 39, 41, 40, 42, 43, 42.5]);

  useEffect(() => {
    const interval = setInterval(() => {
      const change = (Math.random() - 0.5) * 2;
      setPrice(prev => {
        const newPrice = Math.max(1, prev + change);
        setPriceHistory(history => [...history.slice(-19), newPrice]);
        return newPrice;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const handleBuy = () => {
    const amountNum = parseFloat(amount);
    if (!amountNum || amountNum <= 0) {
      toast.error('Введите корректное количество');
      return;
    }
    const total = amountNum * price;
    if (total > balance) {
      toast.error('Недостаточно средств');
      return;
    }

    setBalance(prev => prev - total);
    setCryptoBalance(prev => prev + amountNum);
    
    const newTransaction: Transaction = {
      id: Date.now().toString(),
      type: 'buy',
      amount: amountNum,
      price: price,
      timestamp: new Date(),
      user: 'Вы'
    };
    setTransactions(prev => [newTransaction, ...prev]);
    setAmount('');
    toast.success(`Куплено ${amountNum} EE%A за ${total.toFixed(2)} ₽`);
  };

  const handleSell = () => {
    const amountNum = parseFloat(amount);
    if (!amountNum || amountNum <= 0) {
      toast.error('Введите корректное количество');
      return;
    }
    if (amountNum > cryptoBalance) {
      toast.error('Недостаточно криптовалюты');
      return;
    }

    const total = amountNum * price;
    setBalance(prev => prev + total);
    setCryptoBalance(prev => prev - amountNum);
    
    const newTransaction: Transaction = {
      id: Date.now().toString(),
      type: 'sell',
      amount: amountNum,
      price: price,
      timestamp: new Date(),
      user: 'Вы'
    };
    setTransactions(prev => [newTransaction, ...prev]);
    setAmount('');
    toast.success(`Продано ${amountNum} EE%A за ${total.toFixed(2)} ₽`);
  };

  const priceChange = priceHistory.length >= 2 
    ? ((price - priceHistory[priceHistory.length - 2]) / priceHistory[priceHistory.length - 2] * 100) 
    : 0;

  const maxPrice = Math.max(...priceHistory);
  const minPrice = Math.min(...priceHistory);

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              nEvE%rA
            </h1>
            <p className="text-muted-foreground">EE%A Криптовалютная биржа</p>
          </div>
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={() => window.location.href = '/admin'}
          >
            <Icon name="Settings" size={18} />
            Админ
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
                <Badge variant={priceChange >= 0 ? "default" : "destructive"} className="mb-1">
                  <Icon name={priceChange >= 0 ? "TrendingUp" : "TrendingDown"} size={12} className="mr-1" />
                  {Math.abs(priceChange).toFixed(2)}%
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Баланс ₽</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Icon name="Wallet" size={20} className="text-primary" />
                <span className="text-3xl font-bold">{balance.toFixed(2)} ₽</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">EE%A баланс</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Icon name="Coins" size={20} className="text-secondary" />
                <span className="text-3xl font-bold">{cryptoBalance.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon name="LineChart" size={20} />
                График цены
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-end gap-2">
                {priceHistory.map((histPrice, idx) => {
                  const height = ((histPrice - minPrice) / (maxPrice - minPrice)) * 100;
                  return (
                    <div key={idx} className="flex-1 flex flex-col justify-end group">
                      <div 
                        className="bg-gradient-to-t from-primary to-secondary rounded-t transition-all group-hover:opacity-80"
                        style={{ height: `${height}%` }}
                      />
                      <span className="text-xs text-muted-foreground text-center mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {histPrice.toFixed(1)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon name="ArrowLeftRight" size={20} />
                Торговля
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Количество EE%A</label>
                <Input 
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="bg-background"
                />
                {amount && !isNaN(parseFloat(amount)) && (
                  <p className="text-sm text-muted-foreground">
                    Итого: {(parseFloat(amount) * price).toFixed(2)} ₽
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button 
                  onClick={handleBuy}
                  className="bg-primary hover:bg-primary/90 gap-2"
                >
                  <Icon name="TrendingUp" size={18} />
                  Купить
                </Button>
                <Button 
                  onClick={handleSell}
                  variant="outline"
                  className="border-destructive text-destructive hover:bg-destructive hover:text-white gap-2"
                >
                  <Icon name="TrendingDown" size={18} />
                  Продать
                </Button>
              </div>

              <div className="pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Комиссия:</span>
                  <span>0%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Макс. 24ч:</span>
                  <span>{maxPrice.toFixed(2)} ₽</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Мин. 24ч:</span>
                  <span>{minPrice.toFixed(2)} ₽</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

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
                          {tx.type === 'buy' ? 'Покупка' : 'Продажа'} {tx.amount} EE%A
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {tx.timestamp.toLocaleString('ru-RU')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">
                        {tx.type === 'buy' ? '-' : '+'}{(tx.amount * tx.price).toFixed(2)} ₽
                      </p>
                      <p className="text-sm text-muted-foreground">
                        @ {tx.price.toFixed(2)} ₽
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon name="BarChart3" size={20} />
              Статистика
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-background rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Всего сделок</p>
                <p className="text-2xl font-bold">{transactions.length}</p>
              </div>
              <div className="text-center p-4 bg-background rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Объем торгов</p>
                <p className="text-2xl font-bold">
                  {transactions.reduce((sum, tx) => sum + tx.amount * tx.price, 0).toFixed(0)} ₽
                </p>
              </div>
              <div className="text-center p-4 bg-background rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Средняя цена</p>
                <p className="text-2xl font-bold">
                  {transactions.length > 0 
                    ? (transactions.reduce((sum, tx) => sum + tx.price, 0) / transactions.length).toFixed(2)
                    : '0.00'} ₽
                </p>
              </div>
              <div className="text-center p-4 bg-background rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Холдеров</p>
                <p className="text-2xl font-bold">1,247</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
