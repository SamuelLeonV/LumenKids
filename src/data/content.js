// src/data/content.js
// Single source of truth for all Bible content. Values copied verbatim from the
// original prototypes (legacy/aventura-biblica.html STORIES, legacy/index.html modals).

export const STORIES = [
  { id: 'adan-eva', emoji: '🌳', name: 'Adán y Eva', beacon: 0x7ed957, robe: 0x4caf50, skin: 0xe7b48a,
    story: 'Al principio, Dios creó los cielos y la tierra: la luz, el mar, las plantas, los animales y, por último, a las personas. Vio que todo era muy bueno.',
    q: '¿En cuántos días creó Dios el mundo y luego descansó?', opts: ['3 días', '7 días', '30 días'], answer: 1 },
  { id: 'noe', emoji: '🚢', name: 'Noé', beacon: 0x4a9eff, robe: 0x8d5a2b, skin: 0xd9a06b,
    story: 'Dios le pidió a Noé construir un arca enorme para salvar a su familia y a los animales del gran diluvio. Noé obedeció y los animales entraron de dos en dos.',
    q: '¿De cuántos en cuántos entraron los animales al arca?', opts: ['De uno en uno', 'De dos en dos', 'De diez en diez'], answer: 1 },
  { id: 'moises', emoji: '🌊', name: 'Moisés', beacon: 0x29c7c7, robe: 0x9e3b3b, skin: 0xc98a5a,
    story: 'Dios usó a Moisés para sacar a su pueblo de Egipto. Al llegar al Mar Rojo, Dios abrió las aguas para que cruzaran caminando por tierra seca.',
    q: '¿Qué hizo Dios para que el pueblo cruzara el mar?', opts: ['Un puente de madera', 'Abrió las aguas', 'Secó el mar para siempre'], answer: 1 },
  { id: 'david', emoji: '🪨', name: 'David', beacon: 0xffd23f, robe: 0x3f6fb0, skin: 0xe7b48a,
    story: 'David era un joven pastor. Con fe en Dios y una honda con una piedra, venció al gigante Goliat. Nos enseña que con Dios podemos ser valientes.',
    q: '¿Con qué venció David al gigante Goliat?', opts: ['Una espada enorme', 'Una honda y una piedra', 'Un gran escudo'], answer: 1 },
  { id: 'jonas', emoji: '🐟', name: 'Jonás', beacon: 0x5a8f3a, robe: 0x2e7d6b, skin: 0xd9a06b,
    story: 'Jonás no quería obedecer a Dios y huyó en un barco. Un gran pez se lo tragó. Tras tres días, Jonás oró y el pez lo dejó en la orilla. Aprendió a obedecer.',
    q: '¿Qué se tragó a Jonás?', opts: ['Una ola gigante', 'Un gran pez', 'Una tormenta'], answer: 1 },
  { id: 'daniel', emoji: '🦁', name: 'Daniel', beacon: 0xff9d3a, robe: 0x7b4fae, skin: 0xc98a5a,
    story: 'Daniel amaba orar a Dios. Lo echaron a un foso con leones, pero Dios envió un ángel que cerró la boca de los leones. Daniel salió sano y salvo.',
    q: '¿Quién protegió a Daniel de los leones?', opts: ['Un cazador', 'Dios envió un ángel', 'Los guardias'], answer: 1 },
  { id: 'nino-jesus', emoji: '⭐', name: 'El Niño Jesús', beacon: 0xffe066, robe: 0xfff3c4, skin: 0xe7b48a,
    story: 'Jesús nació en un pesebre en Belén. Una estrella muy brillante guió a los reyes magos para encontrarlo y llevarle regalos.',
    q: '¿En qué ciudad nació Jesús?', opts: ['Jerusalén', 'Belén', 'Nazaret'], answer: 1 },
];

export const CHARACTERS = {
  ovejita:   { key: 'ovejita',   name: 'Ovejita',        desc: 'Tierna y lanudita 🐑' },
  discipulo: { key: 'discipulo', name: 'Discípulo',      desc: 'Sigue a Jesús ✨' },
  nino:      { key: 'nino',      name: 'Niño Cristiano', desc: 'Lleno de fe ❤️' },
};

export const MODALS = {
  cross: { emoji: '✝️', title: 'La Cruz', verse: 'Juan 3:16', c1: '#3a9b63', c2: '#1f5d39',
    text: 'La cruz nos recuerda que Jesús nos ama muchísimo. Dio su vida por nosotros y al tercer día ¡resucitó! La tela roja nos habla de su amor que nos hace libres.' },
  dove: { emoji: '🕊️', title: 'La Paloma', verse: 'Mateo 3:16', c1: '#5fa0d8', c2: '#2f6fae',
    text: 'La palomita lleva una ramita de olivo: es señal de paz. También nos recuerda al Espíritu Santo, el amigo que Dios pone en nuestro corazón para acompañarnos siempre.' },
  jesus: { emoji: '👑', title: 'Jesús, el Buen Pastor', verse: 'Juan 10:11', c1: '#e3aa52', c2: '#bf8129',
    text: 'Jesús es como un pastor bueno que cuida a cada una de sus ovejas. Te conoce por tu nombre, te protege y nunca te deja solo.' },
  sheep: { emoji: '🐑', title: 'La Oveja Perdida', verse: 'Lucas 15:4-7', c1: '#e3886a', c2: '#c8523f',
    text: 'Cuando una ovejita se pierde, el pastor la busca hasta encontrarla. ¡Así te busca Jesús a ti! Eres tan importante que Él nunca se rinde.' },
};
