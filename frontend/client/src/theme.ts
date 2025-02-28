// src/theme.ts
import { 
  extendTheme, 
  withDefaultColorScheme, 
  ThemeConfig
} from '@chakra-ui/react';

const config: ThemeConfig = {
  initialColorMode: 'light',
  useSystemColorMode: false,
};

const colors = {
  brand: {
    50: '#e6f7ff',
    100: '#b3e0ff',
    200: '#80caff',
    300: '#4db3ff',
    400: '#1a9dff',
    500: '#0080ff', // Cor principal
    600: '#0066cc',
    700: '#004d99',
    800: '#003366',
    900: '#001a33',
  },
};

const fonts = {
  body: 'Inter, system-ui, sans-serif',
  heading: 'Inter, system-ui, sans-serif',
};

const components = {
  Button: {
    baseStyle: {
      fontWeight: 'semibold',
      borderRadius: 'md',
    },
    variants: {
      solid: (props: any) => ({
        bg: `${props.colorScheme}.500`,
        color: 'white',
        _hover: {
          bg: `${props.colorScheme}.600`,
        },
        _active: {
          bg: `${props.colorScheme}.700`,
        },
      }),
      outline: (props: any) => ({
        borderColor: `${props.colorScheme}.500`,
        color: `${props.colorScheme}.500`,
        _hover: {
          bg: `${props.colorScheme}.50`,
        },
      }),
      ghost: (props: any) => ({
        color: `${props.colorScheme}.500`,
        _hover: {
          bg: `${props.colorScheme}.50`,
        },
      }),
    },
    sizes: {
      sm: {
        fontSize: 'sm',
        px: 4,
        py: 2,
      },
      md: {
        fontSize: 'md',
        px: 6,
        py: 3,
      },
      lg: {
        fontSize: 'lg',
        px: 8,
        py: 4,
      },
    },
    defaultProps: {
      variant: 'solid',
      size: 'md',
      colorScheme: 'brand',
    },
  },
  // Adicionamos configurações para outros componentes conforme necessário
  Heading: {
    baseStyle: {
      fontWeight: 'bold',
    },
  },
  Card: {
    baseStyle: {
      p: '4',
      borderRadius: 'lg',
      boxShadow: 'md',
      bg: 'white',
      _dark: {
        bg: 'gray.700',
      },
    },
  },
};

const theme = extendTheme(
  {
    colors,
    fonts,
    components,
    config,
  },
  withDefaultColorScheme({ colorScheme: 'brand' })
);

export default theme;