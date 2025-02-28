// frontend/client/src/components/StatusBadge/index.tsx
import React from 'react';
import { Badge, BadgeProps } from '@chakra-ui/react';

interface StatusBadgeProps extends BadgeProps {
  status: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, ...rest }) => {
  const getStatusProps = () => {
    switch (status) {
      case 'PENDENTE':
        return { colorScheme: 'yellow', children: 'Pendente' };
      case 'APROVADO':
        return { colorScheme: 'green', children: 'Aprovado' };
      case 'REJEITADO':
        return { colorScheme: 'red', children: 'Rejeitado' };
      case 'AGUARDANDO':
        return { colorScheme: 'yellow', children: 'Aguardando' };
      case 'EM_ANALISE':
        return { colorScheme: 'blue', children: 'Em Análise' };
      case 'ATIVO':
        return { colorScheme: 'green', children: 'Ativo' };
      case 'INATIVO':
        return { colorScheme: 'red', children: 'Inativo' };
      default:
        return { colorScheme: 'gray', children: status };
    }
  };

  return <Badge {...getStatusProps()} {...rest} />;
};

export default StatusBadge;