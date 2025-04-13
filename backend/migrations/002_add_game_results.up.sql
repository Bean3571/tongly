-- Add game-related tables

-- Table for storing emoji data
CREATE TABLE emojis (
    id SERIAL PRIMARY KEY,
    emoji TEXT NOT NULL,
    name_en VARCHAR(100) NOT NULL,
    name_es VARCHAR(100) NOT NULL,
    name_ru VARCHAR(100) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Table for storing game results
CREATE TABLE game_results (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    game_type VARCHAR(50) NOT NULL, -- 'emoji_quiz' or 'emoji_typing'
    language_id INTEGER NOT NULL,
    score INTEGER NOT NULL,
    completed_at TIMESTAMP NOT NULL DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (language_id) REFERENCES languages(id) ON DELETE CASCADE
);

-- Insert some emoji data
INSERT INTO emojis (emoji, name_en, name_es, name_ru) VALUES
('😀', 'grinning face', 'cara sonriente', 'улыбающееся лицо'),
('😂', 'face with tears of joy', 'cara con lágrimas de alegría', 'лицо со слезами радости'),
('😍', 'smiling face with heart-eyes', 'cara sonriente con ojos de corazón', 'улыбающееся лицо с глазами-сердечками'),
('🥰', 'smiling face with hearts', 'cara sonriente con corazones', 'улыбающееся лицо с сердечками'),
('😎', 'smiling face with sunglasses', 'cara sonriente con gafas de sol', 'улыбающееся лицо в солнцезащитных очках'),
('😭', 'loudly crying face', 'cara llorando ruidosamente', 'громко плачущее лицо'),
('🤔', 'thinking face', 'cara pensativa', 'задумчивое лицо'),
('😴', 'sleeping face', 'cara durmiendo', 'спящее лицо'),
('🥺', 'pleading face', 'cara suplicante', 'умоляющее лицо'),
('😡', 'pouting face', 'cara enfadada', 'надутое лицо'),
('🤗', 'hugging face', 'cara abrazando', 'обнимающее лицо'),
('🙄', 'face with rolling eyes', 'cara con ojos en blanco', 'лицо с закатывающимися глазами'),
('🥳', 'partying face', 'cara de fiesta', 'празднующее лицо'),
('🤯', 'exploding head', 'cabeza explotando', 'взрывающаяся голова'),
('🐱', 'cat face', 'cara de gato', 'морда кота'),
('🐶', 'dog face', 'cara de perro', 'морда собаки'),
('🐼', 'panda', 'panda', 'панда'),
('🐵', 'monkey face', 'cara de mono', 'морда обезьяны'),
('🦁', 'lion', 'león', 'лев'),
('🐘', 'elephant', 'elefante', 'слон'),
('🦒', 'giraffe', 'jirafa', 'жираф'),
('🦊', 'fox', 'zorro', 'лиса'),
('🐙', 'octopus', 'pulpo', 'осьминог'),
('🐬', 'dolphin', 'delfín', 'дельфин'),
('🦋', 'butterfly', 'mariposa', 'бабочка'),
('🍎', 'red apple', 'manzana roja', 'красное яблоко'),
('🍌', 'banana', 'plátano', 'банан'),
('🍓', 'strawberry', 'fresa', 'клубника'),
('🍕', 'pizza', 'pizza', 'пицца'),
('🌮', 'taco', 'taco', 'тако'),
('🍩', 'doughnut', 'dona', 'пончик'),
('🍦', 'ice cream', 'helado', 'мороженое'),
('🥑', 'avocado', 'aguacate', 'авокадо'),
('🚗', 'car', 'coche', 'машина'),
('🚲', 'bicycle', 'bicicleta', 'велосипед'),
('✈️', 'airplane', 'avión', 'самолет'),
('🚢', 'ship', 'barco', 'корабль'),
('🏠', 'house', 'casa', 'дом'),
('🌍', 'globe showing Europe-Africa', 'globo mostrando Europa-África', 'глобус показывает Европу-Африку'),
('⌚', 'watch', 'reloj', 'часы'),
('📱', 'mobile phone', 'teléfono móvil', 'мобильный телефон'),
('💻', 'laptop', 'computadora portátil', 'ноутбук'),
('📷', 'camera', 'cámara', 'камера'),
('🎮', 'video game', 'videojuego', 'видеоигра'),
('🎸', 'guitar', 'guitarra', 'гитара'),
('🎬', 'clapper board', 'claqueta', 'хлопушка'),
('⚽', 'soccer ball', 'balón de fútbol', 'футбольный мяч'),
('🏀', 'basketball', 'baloncesto', 'баскетбол'),
('🎯', 'direct hit', 'diana', 'прямое попадание'),
('🏆', 'trophy', 'trofeo', 'трофей');

-- Create index for game results
CREATE INDEX idx_game_results_user_id ON game_results(user_id);
CREATE INDEX idx_game_results_completed_at ON game_results(completed_at); 