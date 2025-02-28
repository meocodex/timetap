// src/components/Layout/index.tsx
import React from 'react';
import { Box, useDisclosure } from '@chakra-ui/react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';

const Layout: React.FC = () => {
  // No Chakra UI v2, useDisclosure retorna { isOpen, onOpen, onClose, onToggle }
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <Box minH="100vh" bg="gray.50" _dark={{ bg: 'gray.900' }}>
      <Sidebar isOpen={isOpen} onClose={onClose} />
      <Box
        ml={{ base: 0, md: 60 }}
        transition=".3s ease"
      >
        <Header onOpenSidebar={onOpen} />
        <Box as="main" p="4">
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default Layout;