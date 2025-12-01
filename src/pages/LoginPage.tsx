import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';

const API_URL = 'https://functions.poehali.dev/39a8c52b-561a-42dd-962c-bee4cfdd575c';

interface LoginPageProps {
  onLogin: (userId: number, username: string) => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim() || username.length < 2) {
      toast.error('Имя должно быть минимум 2 символа');
      return;
    }

    setLoading(true);
    
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: username.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка при входе');
      }

      toast.success(response.status === 201 ? 'Добро пожаловать!' : 'С возвращением!');
      onLogin(data.id, data.username);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Ошибка соединения');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-card border-primary/20">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
            <Icon name="Coins" size={40} className="text-white" />
          </div>
          <CardTitle className="text-3xl bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            nEvE%rA
          </CardTitle>
          <p className="text-muted-foreground mt-2">EE%A Криптовалютная биржа</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username">Введите ваше имя</Label>
              <Input 
                id="username"
                type="text"
                placeholder="Ваше имя"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-background"
                disabled={loading}
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                Если вы новый пользователь - будет создан аккаунт
              </p>
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-primary/90 gap-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Icon name="Loader2" size={18} className="animate-spin" />
                  Загрузка...
                </>
              ) : (
                <>
                  <Icon name="LogIn" size={18} />
                  Войти / Регистрация
                </>
              )}
            </Button>

            <div className="pt-4 text-center text-sm text-muted-foreground">
              <p>Регистрация нужна для участия в жеребьевках</p>
              <p className="mt-2">и отслеживания ваших транзакций</p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
