// src/components/Layout/Sidebar.tsx
import React from 'react';
import {
  Box,
  Flex,
  Text,
  Icon,
  VStack,
  useColorMode,
  CloseButton,
  Drawer,
  DrawerContent,
  useBreakpointValue,
} from '@chakra-ui/react';
import { Link as ChakraLink } from '@chakra-ui/react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import {
  FiHome,
  FiUsers,
  FiTruck,
  FiBarChart2,
  FiUser,
  FiClipboard,
  FiUserCheck,
  FiBriefcase,
} from 'react-icons/fi';
import { IconType } from 'react-icons';

interface NavItemProps {
  icon: IconType;
  to: string;
  children: React.ReactNode;
}

const NavItem = ({ icon, to, children }: NavItemProps) => {
  const location = useLocation();
  const { colorMode } = useColorMode();
  
  const isActive = location.pathname === to || location.pathname.startsWith(`${to}/`);
  
  return (
    <ChakraLink
      as={RouterLink}
      to={to}
      style={{ textDecoration: 'none' }}
      _focus={{ boxShadow: 'none' }}
      w="full"
    >
      <Flex
        align="center"
        p="3"
        mx="2"
        borderRadius="md"
        role="group"
        cursor="pointer"
        bg={isActive ? 'brand.500' : 'transparent'}
        color={isActive ? 'white' : colorMode === 'light' ? 'gray.600' : 'gray.300'}
        _hover={{
          bg: isActive ? 'brand.600' : colorMode === 'light' ? 'gray.100' : 'gray.700',
          color: isActive ? 'white' : 'brand.500',
        }}
      >
        <Icon
          mr="4"
          fontSize="18"
          as={icon}
        />
        <Text fontWeight={isActive ? 'bold' : 'medium'}>{children}</Text>
      </Flex>
    </ChakraLink>
  );
};

interface SidebarContentProps {
  onClose?: () => void;
}

const SidebarContent = ({ onClose }: SidebarContentProps) => {
  const { colorMode } = useColorMode();
  
  return (
    <Box
      transition="0.3s ease"
      bg={colorMode === 'light' ? 'white' : 'gray.800'}
      borderRight="1px"
      borderRightColor={colorMode === 'light' ? 'gray.200' : 'gray.700'}
      w={{ base: 'full', md: 60 }}
      pos="fixed"
      h="full"
    >
      <Flex h="20" alignItems="center" mx="8" justifyContent="space-between">
        <Text fontSize="2xl" fontWeight="bold" color="brand.500">
          Sparta<span style={{ color: colorMode === 'light' ? 'black' : 'white' }}>kus</span>
        </Text>
        <CloseButton display={{ base: 'flex', md: 'none' }} onClick={onClose} />
      </Flex>

      <VStack spacing="1" mt="4" align="stretch">
        <NavItem icon={FiHome} to="/dashboard">
          Dashboard
        </NavItem>
        <NavItem icon={FiUserCheck} to="/motoristas">
          Motoristas
        </NavItem>
        <NavItem icon={FiTruck} to="/veiculos">
          Veículos
        </NavItem>
        <NavItem icon={FiUser} to="/proprietarios">
          Proprietários
        </NavItem>
        <NavItem icon={FiBriefcase} to="/empresas">
          Empresas
        </NavItem>
        <NavItem icon={FiClipboard} to="/consultas">
          Consultas
        </NavItem>
        <NavItem icon={FiUsers} to="/usuarios">
          Usuários
        </NavItem>
        <NavItem icon={FiBarChart2} to="/relatorios">
          Relatórios
        </NavItem>
      </VStack>
    </Box>
  );
};

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const isDesktop = useBreakpointValue({ base: false, md: true });
  
  if (isDesktop) {
    return <SidebarContent onClose={onClose} />;
  }
  
  return (
    <Drawer
      isOpen={isOpen}
      placement="left"
      onClose={onClose}
      returnFocusOnClose={false}
      onOverlayClick={onClose}
      size="full"
    >
      <DrawerContent>
        <SidebarContent onClose={onClose} />
      </DrawerContent>
    </Drawer>
  );
};

export default Sidebar;