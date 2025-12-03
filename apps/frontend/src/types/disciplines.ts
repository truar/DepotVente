export const disciplines = [
  'Alpin',
  'Fond',
  'Randonnée Alpine',
  'Randonnée Pédestre',
  'Snowboard',
  'Telemark',
]

export const disciplineItems = disciplines.map((discipline) => ({
  label: discipline,
  value: discipline,
}))
