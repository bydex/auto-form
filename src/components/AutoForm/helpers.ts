export const getDefaultPropertiesState = (properties) => {
  return Object.fromEntries(
    Object.entries(properties).map(([key, value]) => {
      const getDefaultValue = () => {
        if (value.type === 'boolean') return false
        else if (value.type === 'number') return 0
        else if (value.type === 'object') return getDefaultPropertiesState(value.properties)
        else if (value.type === 'array') {
          return []
        }

        return ''
      }
      return [key, value.default ?? getDefaultValue()]
    }),
  )
}
