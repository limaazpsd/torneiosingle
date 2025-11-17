// Validadores para formulários

/**
 * Valida username no formato @username
 * - Deve começar com @
 * - Apenas letras, números e underscore
 * - Entre 3 e 20 caracteres (incluindo o @)
 */
export const validateUsername = (username: string): boolean => {
  if (!username) return false;
  
  // Remove @ se já estiver presente para validação
  const cleanUsername = username.startsWith('@') ? username : '@' + username;
  
  // Regex: @ seguido de 2-19 caracteres (letras, números, underscore)
  const usernameRegex = /^@[a-zA-Z0-9_]{2,19}$/;
  
  return usernameRegex.test(cleanUsername);
};

/**
 * Valida CPF brasileiro
 * - Aceita apenas números
 * - Verifica dígitos verificadores
 */
export const validateCPF = (cpf: string): boolean => {
  // Remove caracteres não numéricos
  const cleanCPF = cpf.replace(/\D/g, '');
  
  // Verifica se tem 11 dígitos
  if (cleanCPF.length !== 11) return false;
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false;
  
  // Validação dos dígitos verificadores
  let sum = 0;
  let remainder;
  
  // Valida primeiro dígito
  for (let i = 1; i <= 9; i++) {
    sum += parseInt(cleanCPF.substring(i - 1, i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.substring(9, 10))) return false;
  
  // Valida segundo dígito
  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(cleanCPF.substring(i - 1, i)) * (12 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.substring(10, 11))) return false;
  
  return true;
};

/**
 * Valida RG brasileiro
 * - Aceita de 7 a 9 dígitos
 * - Formato básico (não há algoritmo de validação padronizado para RG)
 */
export const validateRG = (rg: string): boolean => {
  // Remove caracteres não alfanuméricos
  const cleanRG = rg.replace(/[^a-zA-Z0-9]/g, '');
  
  // Verifica se tem entre 7 e 9 caracteres
  if (cleanRG.length < 7 || cleanRG.length > 9) return false;
  
  return true;
};

/**
 * Formata CPF para exibição
 * 123.456.789-10
 */
export const formatCPF = (cpf: string): string => {
  const cleanCPF = cpf.replace(/\D/g, '');
  return cleanCPF.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};

/**
 * Formata RG para exibição
 * 12.345.678-9
 */
export const formatRG = (rg: string): string => {
  const cleanRG = rg.replace(/[^a-zA-Z0-9]/g, '');
  
  if (cleanRG.length === 9) {
    return cleanRG.replace(/(\d{2})(\d{3})(\d{3})(\d{1})/, '$1.$2.$3-$4');
  } else if (cleanRG.length === 8) {
    return cleanRG.replace(/(\d{2})(\d{3})(\d{3})/, '$1.$2.$3');
  }
  
  return cleanRG;
};

/**
 * Remove o caractere '@' do início de um username, se presente.
 */
export const removeAtSign = (username: string): string => {
  if (!username) return '';
  return username.startsWith('@') ? username.substring(1) : username;
};

/**
 * Formata username para retornar o valor limpo (sem @) e em minúsculas.
 * Deve ser usado para armazenar no banco de dados e para buscar.
 */
export const formatUsername = (username: string): string => {
  if (!username) return '';
  const cleanUsername = removeAtSign(username);
  return cleanUsername.toLowerCase();
};