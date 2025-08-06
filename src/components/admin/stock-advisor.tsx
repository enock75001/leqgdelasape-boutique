
'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '../ui/button';
import { Bot, Loader2, Send, X } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { AnimatePresence, motion } from 'framer-motion';
import { Input } from '../ui/input';
import { stockAdvisorFlow } from '@/ai/flows/stock-advisor-flow';
import { ScrollArea } from '../ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';

type Message = {
    role: 'user' | 'assistant';
    content: string;
};

export function StockAdvisor() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen && messages.length === 0) {
        // Initial message from AI when chat opens for the first time
        setMessages([{ role: 'assistant', content: "Bonjour ! Je suis votre conseiller en stock. Comment puis-je vous aider aujourd'hui ? Vous pouvez me demander, par exemple, 'quels sont les produits avec un stock bas ?'" }]);
    }
  };

  const handleSend = async () => {
    if (input.trim() === '') return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
        const response = await stockAdvisorFlow(input);
        const assistantMessage: Message = { role: 'assistant', content: response };
        setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
        console.error("Error calling stock advisor flow:", error);
        const errorMessage: Message = { role: 'assistant', content: "Désolé, une erreur est survenue. Veuillez réessayer." };
        setMessages(prev => [...prev, errorMessage]);
    } finally {
        setIsLoading(false);
    }
  };
  
   useEffect(() => {
    // Auto-scroll to the bottom when new messages are added
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);


  return (
    <>
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={handleToggle}
          size="lg"
          className="rounded-full w-16 h-16 shadow-lg"
        >
          {isOpen ? <X className="h-6 w-6" /> : <Bot className="h-6 w-6" />}
        </Button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed bottom-24 right-6 z-40"
          >
            <Card className="w-full max-w-sm h-[60vh] flex flex-col shadow-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5" />
                  Conseiller en Stock IA
                </CardTitle>
              </CardHeader>
              <ScrollArea className="flex-grow p-4" ref={scrollAreaRef}>
                 <div className="space-y-4 pr-4">
                    {messages.map((message, index) => (
                      <div key={index} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {message.role === 'assistant' && (
                           <Avatar className="h-8 w-8">
                             <AvatarFallback>IA</AvatarFallback>
                           </Avatar>
                        )}
                        <div className={`rounded-lg px-4 py-2 max-w-xs ${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                          <p className="text-sm">{message.content}</p>
                        </div>
                         {message.role === 'user' && (
                           <Avatar className="h-8 w-8">
                            <AvatarFallback>VOUS</AvatarFallback>
                           </Avatar>
                        )}
                      </div>
                    ))}
                    {isLoading && (
                       <div className="flex justify-start gap-3">
                           <Avatar className="h-8 w-8">
                             <AvatarFallback>IA</AvatarFallback>
                           </Avatar>
                           <div className="rounded-lg px-4 py-2 bg-muted flex items-center">
                              <Loader2 className="h-5 w-5 animate-spin"/>
                           </div>
                       </div>
                    )}
                 </div>
              </ScrollArea>
              <CardFooter className="p-4 border-t">
                <div className="flex w-full items-center space-x-2">
                  <Input 
                    placeholder="Posez une question..." 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => { if (e.key === 'Enter') handleSend(); }}
                    disabled={isLoading}
                  />
                  <Button onClick={handleSend} disabled={isLoading || !input.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
