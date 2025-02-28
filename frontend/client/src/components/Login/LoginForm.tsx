// src/components/Login/LoginForm.tsx
import React from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Heading,
  Text,
  FormErrorMessage,
  useToast,
} from '@chakra-ui/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../contexts/AuthContext';

// Schema de validação com Zod
const loginSchema = z.object({
  email: z.string().email({ message: 'Email inválido' }),
  senha: z.string().min(6, { message: 'A senha deve ter no mínimo 6 caracteres' }),
});

// Tipo inferido do schema
type LoginFormData = z.infer<typeof loginSchema>;

const LoginForm: React.FC = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const { signIn } = useAuth();
  const toast = useToast();

  const onSubmit = async (data: LoginFormData) => {
    try {
      await signIn(data);
    } catch (error) {
      toast({
        title: 'Erro ao fazer login',
        description: 'Verifique suas credenciais e tente novamente.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Box
      p="8"
      width={{ base: '90%', md: '400px' }}
      borderWidth="1px"
      borderRadius="lg"
      boxShadow="lg"
      bg="white"
      _dark={{ bg: 'gray.700', borderColor: 'gray.600' }}
    >
      <VStack spacing="4" align="flex-start">
        <Heading as="h2" size="xl">
          Login
        </Heading>
        <Text color="gray.600" _dark={{ color: 'gray.300' }}>
          Acesse o sistema com suas credenciais
        </Text>
        
        <form onSubmit={handleSubmit(onSubmit)} style={{ width: '100%' }}>
          <VStack spacing="4" align="flex-start" width="100%">
            <FormControl isInvalid={!!errors.email}>
              <FormLabel htmlFor="email">Email</FormLabel>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                {...register('email')}
              />
              {errors.email && (
                <FormErrorMessage>{errors.email.message}</FormErrorMessage>
              )}
            </FormControl>
            
            <FormControl isInvalid={!!errors.senha}>
              <FormLabel htmlFor="senha">Senha</FormLabel>
              <Input
                id="senha"
                type="password"
                placeholder="******"
                {...register('senha')}
              />
              {errors.senha && (
                <FormErrorMessage>{errors.senha.message}</FormErrorMessage>
              )}
            </FormControl>
            
            <Button
              type="submit"
              colorScheme="blue"
              width="full"
              isLoading={isSubmitting}
              loadingText="Entrando..."
            >
              Entrar
            </Button>
          </VStack>
        </form>
      </VStack>
    </Box>
  );
};

export default LoginForm;