const shuffle = <T>(items: T[]) => {
  const newItems = [...items]
  for (let i = newItems.length - 1; i !== 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[newItems[i], newItems[j]] = [newItems[j], newItems[i]]
  }
  return newItems
}

export default shuffle
