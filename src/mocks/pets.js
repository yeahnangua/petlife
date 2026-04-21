/**
 * 宠物档案 mock
 */
const avatar = (id) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=240&q=70`

export const pets = [
  {
    id: 'pet-01',
    name: '橘子',
    type: 'cat',
    breed: '中华田园猫 · 橘猫',
    gender: 'male',
    neutered: true,
    birthday: '2023-06-12',
    age: '2岁 10月',
    weight: 5.2,
    allergies: ['牛肉'],
    preferences: ['洗护清洁', '驱虫护理'],
    avatar: avatar('photo-1543852786-1cf6624b9987'),
    color: '#D97757'
  },
  {
    id: 'pet-02',
    name: '小饭团',
    type: 'cat',
    breed: '英国短毛猫 · 蓝白',
    gender: 'female',
    neutered: true,
    birthday: '2024-08-30',
    age: '1岁 8月',
    weight: 3.8,
    allergies: [],
    preferences: ['造型美容'],
    avatar: avatar('photo-1592194996308-7b43878e84a6'),
    color: '#8AA3B4'
  },
  {
    id: 'pet-03',
    name: 'Mocha',
    type: 'dog',
    breed: '比熊犬',
    gender: 'male',
    neutered: false,
    birthday: '2022-02-14',
    age: '4岁 2月',
    weight: 6.5,
    allergies: ['鸡肉', '谷物'],
    preferences: ['精致美容', '短期寄养'],
    avatar: avatar('photo-1583337130417-3346a1be7dee'),
    color: '#B58463'
  }
]

export const petBreeds = {
  cat: ['中华田园猫', '英国短毛猫', '美国短毛猫', '布偶猫', '暹罗猫', '加菲猫', '其他'],
  dog: ['比熊犬', '柯基犬', '金毛寻回犬', '拉布拉多犬', '博美犬', '泰迪犬', '其他']
}

export const findPet = (id) => pets.find((p) => p.id === id)

export default { pets, petBreeds, findPet }
