export const download = (name: string, content: string, type: string) => {
  const a = document.createElement('a')
  const url = URL.createObjectURL(new Blob([content], { type }))
  a.href = url
  a.download = name
  a.click()
  URL.revokeObjectURL(url)
}
