// src/components/Layout/Header.tsx
import React from 'react';
import {
  Flex,
  Text,
  IconButton,
  Avatar,
  Heading,
  HStack,
  useColorMode,
  Icon,
} from '@chakra-ui/react';
import {
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
} from '@chakra-ui/react';
import { FiBell, FiSettings, FiLogOut, FiMenu } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';

interface HeaderProps {
  onOpenSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ onOpenSidebar }) => {
  const { user, signOut } = useAuth();
  const { colorMode } = useColorMode();
  
  // Definir cores baseadas no modo de cores
  const bgColor = colorMode === 'light' ? 'white' : 'gray.800';
  const borderColor = colorMode === 'light' ? 'gray.200' : 'gray.700';

  return (
    <Flex
      as="header"
      align="center"
      justify="space-between"
      w="full"
      px="4"
      bg={bgColor}
      borderBottomWidth="1px"
      borderBottomColor={borderColor}
      h="16"
    >
      <Flex align="center">
        <IconButton
          display={{ base: 'flex', md: 'none' }}
          onClick={onOpenSidebar}
          variant="ghost"
          aria-label="Abrir menu"
          icon={<Icon as={FiMenu} />}
        />
        <Heading
          as="h1"
          size="md"
          color="brand.500"
          ml={{ base: '2', md: '0' }}
        >
          Spartakus
        </Heading>
      </Flex>

      <HStack gap="4">
        <IconButton
          aria-label="Notificações"
          variant="ghost"
          colorScheme="brand"
          icon={<Icon as={FiBell} />}
        />

        <Menu>
          <MenuButton>
            <HStack>
              <Avatar size="sm" name={user?.nome} />
              <Text display={{ base: 'none', md: 'flex' }}>{user?.nome || 'Usuário'}</Text>
            </HStack>
          </MenuButton>
          <MenuList>
            <MenuItem icon={<Icon as={FiSettings} />}>Configurações</MenuItem>
            <MenuDivider />
            <MenuItem icon={<Icon as={FiLogOut} />} onClick={signOut}>
              Sair
            </MenuItem>
          </MenuList>
        </Menu>
      </HStack>
    </Flex>
  );
};

export default Header;