# Diretrizes de Desenvolvimento e Stack Tecnológico

Este documento estabelece as regras e o stack tecnológico para garantir a consistência, manutenibilidade e qualidade do projeto.

## 1. Stack Tecnológico

O projeto é construído com as seguintes tecnologias:

*   **Frontend Framework:** React (com Vite para tooling).
*   **Linguagem:** TypeScript.
*   **Estilização:** Tailwind CSS (abordagem utility-first).
*   **Componentes UI:** shadcn/ui (baseado em Radix UI).
*   **Roteamento:** React Router DOM.
*   **Gerenciamento de Estado/Dados:** React Query (`@tanstack/react-query`).
*   **Backend/Database:** Supabase (para Auth, Database e Edge Functions).
*   **Formulários e Validação:** React Hook Form e Zod.
*   **Ícones:** Lucide React.
*   **Notificações:** Sonner (para toasts).

## 2. Regras de Uso de Bibliotecas e Componentes

Para manter a consistência e a manutenibilidade, siga as seguintes regras:

### 2.1. Interface do Usuário (UI)

*   **Componentes:** Utilize exclusivamente os componentes disponíveis na biblioteca `shadcn/ui` (localizados em `src/components/ui/`).
*   **Customização:** Se for necessário modificar a aparência ou o comportamento de um componente `shadcn/ui`, **NUNCA** edite o arquivo original em `src/components/ui/`. Crie um novo componente wrapper em `src/components/` que utilize e estenda o componente base.
*   **Estilo:** Utilize classes do Tailwind CSS para toda a estilização. Priorize designs responsivos por padrão.

### 2.2. Dados e Backend

*   **Interação com o Banco de Dados:** Toda comunicação com o backend deve ser feita através do cliente Supabase (`@/integrations/supabase/client`).
*   **Gerenciamento de Dados:** Utilize `useQuery` e `useMutation` do React Query para todas as operações de leitura, escrita e cache de dados.

### 2.3. Lógica e Formulários

*   **Formulários:** Utilize `react-hook-form` para gerenciar o estado e a submissão de formulários.
*   **Validação:** Utilize `zod` para definir e validar os schemas de formulário.

### 2.4. Estrutura de Arquivos

*   **Componentes e Páginas:** Mantenha a estrutura de diretórios existente (`src/pages/`, `src/components/`, `src/hooks/`, etc.).
*   **Rotas:** Mantenha a definição de rotas centralizada em `src/App.tsx`.

### 2.5. Boas Práticas

*   **Simplicidade:** Priorize soluções simples e elegantes. Evite over-engineering.
*   **Internacionalização:** O idioma principal é o Português (pt-BR).