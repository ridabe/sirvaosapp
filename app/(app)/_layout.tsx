import { useState, useRef } from 'react'
import { View, Animated, TouchableWithoutFeedback, StyleSheet, Dimensions } from 'react-native'
import { Slot } from 'expo-router'
import { DrawerMenu } from '@/components/ui/DrawerMenu'
import { AppHeader } from '@/components/ui/AppHeader'
import { OfflineBanner } from '@/components/ui/OfflineBanner'
import { usePathname } from 'expo-router'
import { colors } from '@/constants/colors'

const DRAWER_WIDTH = Dimensions.get('window').width * 0.82

const ROUTE_TITLES: Record<string, string> = {
  '/': 'Início',
  '/notificacoes': 'Notificações',
  '/perfil': 'Meu Perfil',
  '/modulos/louvor': 'Louvor',
  '/modulos/louvor/admin': 'Louvor — Administração',
  '/modulos/financeiro': 'Financeiro',
  '/modulos/kids': 'Kids',
  '/modulos/kids/admin': 'Kids — Administração',
  '/modulos/escola-biblica': 'Escola Bíblica',
  '/modulos/acao-social': 'Ação Social',
  '/modulos/intercessao': 'Intercessão',
  '/modulos/intercessao/pedido/novo': 'Pedido de Oração',
}

export default function AppLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current
  const overlayAnim = useRef(new Animated.Value(0)).current
  const pathname = usePathname()

  const title = ROUTE_TITLES[pathname] ?? 'SirvaOS'
  const isHome = pathname === '/'

  function openDrawer() {
    setDrawerOpen(true)
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 0,
        speed: 20,
      }),
      Animated.timing(overlayAnim, {
        toValue: 0.45,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start()
  }

  function closeDrawer() {
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: -DRAWER_WIDTH,
        useNativeDriver: true,
        bounciness: 0,
        speed: 20,
      }),
      Animated.timing(overlayAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => setDrawerOpen(false))
  }

  return (
    <View style={styles.root}>
      {/* Header fixo */}
      <AppHeader title={title} onMenuPress={openDrawer} showBack={!isHome} />

      {/* Conteúdo da tela atual */}
      <View style={styles.content}>
        <OfflineBanner />
        <Slot />
      </View>

      {/* Overlay escuro ao abrir o drawer */}
      {drawerOpen && (
        <TouchableWithoutFeedback onPress={closeDrawer}>
          <Animated.View
            style={[styles.overlay, { opacity: overlayAnim }]}
            pointerEvents="auto"
          />
        </TouchableWithoutFeedback>
      )}

      {/* Drawer lateral */}
      <Animated.View
        style={[
          styles.drawer,
          { width: DRAWER_WIDTH, transform: [{ translateX: slideAnim }] },
        ]}
        pointerEvents={drawerOpen ? 'auto' : 'none'}
      >
        <DrawerMenu onClose={closeDrawer} />
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  content: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
    zIndex: 10,
  },
  drawer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    zIndex: 20,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 16,
  },
})
