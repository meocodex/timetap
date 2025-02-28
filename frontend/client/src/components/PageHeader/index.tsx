// src/components/PageHeader/index.tsx
import React from 'react';
import { Box, Flex, Heading, Button, Spacer, Text, Icon } from '@chakra-ui/react';
import { FiArrowLeft } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

interface ActionButton {
  label: string;
  icon?: React.ReactElement;
  onClick: () => void;
  [key: string]: any;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  actionButton?: ActionButton;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  showBackButton = false,
  actionButton,
}) => {
  const navigate = useNavigate();

  return (
    <Box
      as="header"
      mb="6"
      pb="4"
      borderBottomWidth="1px"
      borderBottomColor="gray.200"
      _dark={{ borderBottomColor: "gray.700" }}
    >
      <Flex align="center" mb={subtitle ? "2" : "0"}>
        {showBackButton && (
          <Button
            variant="ghost"
            mr="3"
            onClick={() => navigate(-1)}
            leftIcon={<Icon as={FiArrowLeft} />}
          >
            Voltar
          </Button>
        )}
        
        <Heading as="h1" size="lg">
          {title}
        </Heading>
        
        <Spacer />
        
        {actionButton && (
          <Button
            colorScheme="brand"
            leftIcon={actionButton.icon}
            {...actionButton}
          >
            {actionButton.label}
          </Button>
        )}
      </Flex>
      
      {subtitle && (
        <Text color="gray.600" fontSize="md" _dark={{ color: "gray.400" }}>
          {subtitle}
        </Text>
      )}
    </Box>
  );
};

export default PageHeader;