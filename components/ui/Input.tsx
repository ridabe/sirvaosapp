import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, TextInputProps } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { common, spacing } from '@/lib/theme'
import { colors } from '@/constants/colors'

type Props = TextInputProps & {
  label?: string
  error?: string
  password?: boolean
}

export function Input({ label, error, password = false, ...props }: Props) {
  const [focused, setFocused] = useState(false)
  const [show, setShow] = useState(false)

  return (
    <View style={styles.wrapper}>
      {label && <Text style={common.label}>{label}</Text>}
      <View>
        <TextInput
          {...props}
          secureTextEntry={password && !show}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={[
            common.input,
            focused && common.inputFocused,
            error && common.inputError,
            password && styles.inputPadded,
            props.style,
          ]}
          placeholderTextColor={colors.neutral[300]}
          autoCapitalize={props.autoCapitalize ?? 'none'}
        />
        {password && (
          <TouchableOpacity style={styles.eye} onPress={() => setShow(s => !s)}>
            <Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.neutral[500]} />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={common.errorText}>{error}</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: spacing.md },
  inputPadded: { paddingRight: 48 },
  eye: { position: 'absolute', right: 14, top: 0, bottom: 0, justifyContent: 'center' },
})
