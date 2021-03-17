export function formatTitle(title:string):string {
  const normalizedTitle = title.trim().replace(/ /g, '-').toLowerCase()
  return encodeURIComponent(normalizedTitle)
}
