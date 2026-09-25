/* Ukrainian display catalogue. IDs, gameplay state and weapon model numbers stay unchanged. */
(function(root){
'use strict';
var pairs = `
ROOK|ГРАК
GHOST|ПРИВИД
TALON|КІГОТЬ
NOMAD|КОЧІВНИК
WRAITH|ПРИМАРА
FULL BODY ARMOUR|ПОВНИЙ БРОНЕКОМПЛЕКТ
RESTORE 100% ARMOUR|ВІДНОВИТИ 100% БРОНІ
100% armour · to belt|100% броні · на пояс
100% ARMOUR|100% БРОНІ
ARMOUR ALREADY FULL|БРОНЯ ВЖЕ ПОВНА
FULL BODY ARMOUR SAVED|БРОНЕКОМПЛЕКТ ЗБЕРЕЖЕНО
Capture all three bases|Захопіть усі три бази
Clear all hostiles|Знищте всіх ворогів
Destroy the enemy drone base|Знищте ворожу базу дронів
Defeat the compound boss|Переможіть боса комплексу
Capture both enemy headquarters|Захопіть обидва ворожі штаби
Rescue the allied soldiers|Врятуйте союзних бійців
Destroy both weapons depots|Знищте обидва склади зброї
Defeat General Grakov|Переможіть генерала Гракова
Sink all seven fleet ships|Потопіть усі сім кораблів флоту
Eliminate shore troops|Знищте берегові війська
Destroy the Kerch road / rail bridge|Зруйнуйте Керченський автомобільний і залізничний міст
Destroy the sea boss|Знищте морського боса
Destroy all six refineries|Знищте всі шість нафтопереробних об’єктів
Neutralise SAM sites|Знищте зенітні ракетні комплекси
Destroy all six patrol tanks|Знищте всі шість патрульних танків
Defeat the Oil Baron|Переможіть нафтового барона
Destroy all cargo planes|Знищте всі вантажні літаки
Repel both assault waves|Відбийте обидві хвилі штурму
Defeat the airfield commander|Переможіть командира аеродрому
Capture both flags and destroy the drone base|Захопіть обидва прапори та знищте базу дронів
Defeat the final boss|Переможіть фінального боса

CALL THE REINFORCEMENTS|ВИКЛИКАТИ ПІДКРІПЛЕННЯ
REINFORCEMENTS|ПІДКРІПЛЕННЯ
REINFORCEMENTS ACTIVE|ПІДКРІПЛЕННЯ ВЖЕ В БОЮ
WAIT FOR THE CURRENT SQUAD|ДОЧЕКАЙТЕСЯ ЗАВЕРШЕННЯ ДІЙ ЗАГОНУ
NO ROOM FOR REINFORCEMENTS|НЕМАЄ МІСЦЯ ДЛЯ ПІДКРІПЛЕННЯ
MOVE TO OPEN GROUND|ВИЙДІТЬ НА ВІДКРИТУ МІСЦЕВІСТЬ
REINFORCEMENTS INBOUND|ПІДКРІПЛЕННЯ ПРИБУЛО
5 SOLDIERS · 15 SECONDS|5 БІЙЦІВ · 15 СЕКУНД
5 soldiers · 15s · can be killed|5 бійців · 15 с · можуть загинути
BREACHED|ПРОРВАНО
INTEGRITY|МІЦНІСТЬ
NK CARGO|ВАНТАЖНИЙ ЛІТАК КНДР
MY HOUSE!|МІЙ ДІМ!
NOT AGAIN|ТІЛЬКИ НЕ ЗНОВУ
RUN!|БІЖІТЬ!
THIS WAY!|СЮДИ!
DON’T SHOOT|НЕ СТРІЛЯЙТЕ
HURRY|МЕРЩІЙ
DROPPED|ВИКИНУТО
3 RAIL SHOTS|3 ПОСТРІЛИ РЕЙКОТРОНА
RDS|НАБОЇВ
STILL STANDING|ЩЕ ТРИМАЮТЬСЯ
NO ONE LEFT|НІКОГО НЕ ЗАЛИШИЛОСЯ
TAKING OVER|ПРИЙМАЄ КЕРУВАННЯ
OF 5 LEFT|ІЗ 5 ЗАЛИШИЛОСЯ
OFF THE TRUCK|ІЗ ВАНТАЖІВКИ
AWAY|ЗАПУЩЕНО
CAR HP|МІЦНІСТЬ МАШИНИ
HITS|ВЛУЧАННЯ
ELITE|ЕЛІТА
STAND HERE TO BOARD|СТАНЬТЕ ТУТ ДЛЯ ПОСАДКИ
GUNBOAT AWAY|БОЙОВИЙ КАТЕР ВИРУШИВ
PAD|МАЙДАНЧИК
FLAMER|ВОГНЕМЕТ
SENTRY|ТУРЕЛЬ
RECORDING  ·  V to stop|ЗАПИС  ·  V — ЗУПИНИТИ
DOWNLOADING VIDEO…|ЗАВАНТАЖЕННЯ ВІДЕО…
HIGHLIGHT SAVED|МОМЕНТ ЗБЕРЕЖЕНО
auto|авт.
semi|напівавт.
rpm|постр./хв
rds|наб.
targets|цілей
dmg|шкоди
Sweep the compound, then get to the flagpole in the forecourt, haul their colours down and run yours up. They will come back for it.|Зачистьте укріплення, дістаньтеся флагштока на подвір’ї, спустіть ворожий прапор і підніміть свій. Ворог спробує повернути позицію.
Sweep the ruin. Enemy squads push in from every side. Crack open supply crates to pull weapon and ammo cards — you only carry one gun, so choose well.|Зачистьте руїни. Ворожі загони наступають з усіх боків. Відкривайте ящики постачання, щоб отримати зброю та набої.
CAPTURE ENEMY HQ|ЗАХОПІТЬ ВОРОЖІ ШТАБИ
RESCUE ALLIED SOLDIERS|ВРЯТУЙТЕ СОЮЗНИХ БІЙЦІВ
DESTROY DEPOTS|ЗНИЩТЕ СКЛАДИ
3 HEAVY DRONES EACH|ПО 3 ВАЖКІ ДРОНИ
ELIMINATE GENERAL GRAKOV|ЗНИЩТЕ ГЕНЕРАЛА ГРАКОВА
DESTROY CARGO PLANES|ЗНИЩТЕ ВАНТАЖНІ ЛІТАКИ
REPEL ASSAULT WAVES|ВІДБИЙТЕ ШТУРМОВІ ХВИЛІ
DEFEAT THE AIRFIELD COMMANDER|ПЕРЕМОЖІТЬ КОМАНДИРА АЕРОДРОМУ
DESTROY REFINERIES|ЗНИЩТЕ НАФТОЗАВОДИ
NEUTRALISE SAM SITES|ЗНЕШКОДЬТЕ ПОЗИЦІЇ ППО
DESTROY PATROL TANKS|ЗНИЩТЕ ПАТРУЛЬНІ ТАНКИ
DEFEAT THE OIL BARON|ПЕРЕМОЖІТЬ НАФТОВОГО БАРОНА
SINK THE FLEET|ПОТОПІТЬ ФЛОТ
ELIMINATE SHORE TROOPS|ЗНИЩТЕ БІЙЦІВ НА БЕРЕЗІ
DESTROY KERCH ROAD / RAIL BRIDGE|ЗНИЩТЕ АВТОМОБІЛЬНИЙ І ЗАЛІЗНИЧНИЙ КЕРЧЕНСЬКИЙ МІСТ
DESTROY THE SEA BOSS|ЗНИЩТЕ МОРСЬКОГО БОСА
DEFEAT THE FINAL BOSS|ПЕРЕМОЖІТЬ ФІНАЛЬНОГО БОСА
CAPTURE BASES|ЗАХОПІТЬ БАЗИ
DESTROY ENEMY DRONE BASE|ЗНИЩТЕ ВОРОЖУ БАЗУ ДРОНІВ
DEFEAT THE COMPOUND BOSS|ПЕРЕМОЖІТЬ БОСА УКРІПЛЕННЯ
CONTACTS|ЦІЛЕЙ
BASES TAKEN|БАЗ ЗАХОПЛЕНО
ENEMY WAVE|ВОРОЖА ХВИЛЯ
INCOMING|НАБЛИЖАЄТЬСЯ
OF 2|ІЗ 2
DRONES HEADING FOR HOME|ДРОНИ ЛЕТЯТЬ ДО НАШОЇ БАЗИ
SHOOT THEM DOWN OR USE THE JAMMER|ЗБИЙТЕ ЇХ АБО ВИКОРИСТАЙТЕ ГЛУШНИК
IMPACT IN 5 SECONDS · CLEAR THE MARKERS|ВЛУЧАННЯ ЧЕРЕЗ 5 СЕКУНД · ВІДІЙДІТЬ ВІД ПОЗНАЧОК
OIL TRAIN DETONATED|ПОЇЗД ІЗ ПАЛЬНИМ ПІДІРВАНО
KERCH BRIDGE DESTROYED|КЕРЧЕНСЬКИЙ МІСТ ЗНИЩЕНО
STILL AFLOAT|ЩЕ НА ПЛАВУ
THE SEA IS CLEAR|МОРЕ ЗАЧИЩЕНО
SUNK|ЗАТОПЛЕНО
HIT|УРАЖЕНО
SALVO INBOUND|ЗАЛП НА ПІДЛЬОТІ
TARGET BUILDINGS REMAIN|ЦІЛЬОВИХ БУДІВЕЛЬ ЗАЛИШИЛОСЯ
ALL TARGET BUILDINGS DOWN|УСІ ЦІЛЬОВІ БУДІВЛІ ЗНИЩЕНО
STILL PUMPING|ЩЕ ПРАЦЮЮТЬ
THE FIELD IS BURNING|НАФТОПРОМИСЕЛ ПАЛАЄ
UNLOADING STOPPED|РОЗВАНТАЖЕННЯ ПРИПИНЕНО
UNLOADING|РОЗВАНТАЖЕННЯ
BASE|БАЗА
GARRISON DOWN|ГАРНІЗОН ЗНИЩЕНО
TAKEN|ЗАХОПЛЕНО
LEVEL ONE CLEAR|ПЕРШИЙ СЕКТОР ЗАЧИЩЕНО
LEVEL TWO CLEAR|ДРУГИЙ СЕКТОР ЗАЧИЩЕНО
LEVEL THREE CLEAR|ТРЕТІЙ СЕКТОР ЗАЧИЩЕНО
LEVEL FOUR CLEAR|ЧЕТВЕРТИЙ СЕКТОР ЗАЧИЩЕНО
LEVEL FIVE CLEAR|П’ЯТИЙ СЕКТОР ЗАЧИЩЕНО
RED SQUARE CLEAR|ЧЕРВОНУ ПЛОЩУ ЗАЧИЩЕНО
DEFEATED|ПЕРЕМОЖЕНО
ELIMINATED|ЗНИЩЕНО
LEVEL|РІВЕНЬ
BOSS|БОС
ALEKSANDR MOISEYEV|ОЛЕКСАНДР МОІСЕЄВ
VALERY GERASIMOV|ВАЛЕРІЙ ГЕРАСИМОВ
DMITRY MEDVEDEV|ДМИТРО МЕДВЕДЄВ
KIM JONG UN|КІМ ЧЕН ИН
VLADIMIR PUTIN|ВОЛОДИМИР ПУТІН
KIM JONG UN ENTERS MILITARY AID|КІМ ЧЕН ИН ВСТУПАЄ В БІЙ
DMITRY MEDVEDEV ENTERS CRUDE INTENTIONS|ДМИТРО МЕДВЕДЄВ ВСТУПАЄ В БІЙ
COMMAND SHIP INBOUND · GUNS BLAZING|КОМАНДНИЙ КОРАБЕЛЬ НАБЛИЖАЄТЬСЯ ТА ВЕДЕ ВОГОНЬ
PILOT SETTINGS|НАЛАШТУВАННЯ ПІЛОТА
SIGN IN|УВІЙТИ
SIGN OUT|ВИЙТИ
SECTORS|СЕКТОРИ
NOW PLAYING|ГРА ТРИВАЄ
BACK TO INFO|ДО ІНФОРМАЦІЇ
PLAY|ГРАТИ
REPLAY|ГРАТИ ЗНОВУ
PLAY SECTOR 1 FREE|ГРАТИ В СЕКТОР 1 БЕЗКОШТОВНО
SIGN IN · SECTOR 1 FREE|УВІЙТИ · СЕКТОР 1 БЕЗКОШТОВНО
COMPLETE SECTOR|ЗАВЕРШІТЬ СЕКТОР
TO UNLOCK|ЩОБ ВІДКРИТИ
Unlock all Sectors|Відкрити всі сектори
UNLOCK ALL SECTORS|ВІДКРИТИ ВСІ СЕКТОРИ
KILLS|ЗНИЩЕНО
TIME|ЧАС
CASH OUT|КОШТИ
SQUAD LOST|ВТРАТИ ЗАГОНУ
Breach 3 compound perimeters|Прорвіть периметри 3 укріплень
Neutralize enemy forces|Знешкодьте ворожі сили
Destroy the enemy drone base (top-left house)|Знищте ворожу базу дронів (будинок угорі ліворуч)
Eliminate Level One Boss|Знищте боса першого сектора
Push through enemy trenches|Прорвіться крізь ворожі траншеї
Clear the front-line network|Зачистьте передові позиції
Secure the trench boss|Знищте боса траншей
Establish naval dominance|Здобудьте перевагу на морі
Destroy the Black Sea fleet|Знищте Чорноморський флот
Defeat the sea commander|Переможіть морського командира
Disrupt enemy supply lines|Перервіть вороже постачання
Destroy oil infrastructure|Знищте нафтову інфраструктуру
Take out the field boss|Знищте польового командира
Suppress air defenses|Придушіть ППО
Ground the enemy air force|Знищте ворожу авіацію
Neutralize the airfield boss|Знешкодьте командира аеродрому
Breach the inner circle|Прорвіть внутрішню оборону
Push to Red Square|Прорвіться до Червоної площі
Final confrontation — finish it|Фінальна битва — завершіть справу
HEALTH|ЗДОРОВ’Я
ARMOUR|БРОНЯ
BASE INTEGRITY|МІЦНІСТЬ БАЗИ
SECTOR|СЕКТОР
HOSTILES|ВОРОГІВ
HOSTILE|ВОРОГ
SQUAD|ЗАГІН
FRAG|ГРАНАТА
FIRE|ВОГОНЬ
JUMP|СТРИБОК
READY|ГОТОВО
BOOM|ПІДРИВ
OPEN|ВІДКРИТИ
RELOAD|ПЕРЕЗАРЯДИТИ
RELOADING|ПЕРЕЗАРЯДКА
DRY|НЕМА НАБОЇВ
QUARTERMASTER|ІНТЕНДАНТ
F.O.B. SUPPLY DEPOT|СКЛАД ПОСТАЧАННЯ БАЗИ
EQUIPMENT|СПОРЯДЖЕННЯ
COST|ЦІНА
BUY|КУПИТИ
OWNED|ПРИДБАНО
DEPLOYED|РОЗГОРНУТО
LOCKED|ЗАБЛОКОВАНО
RETURN TO FIGHT|ПОВЕРНУТИСЯ В БІЙ
PURCHASED|ПРИДБАНО
NOT ENOUGH CASH|БРАКУЄ КОШТІВ
ALREADY FITTED|УЖЕ ВСТАНОВЛЕНО
PLATE|БРОНЕПЛИТА
FIELD KIT|АПТЕЧКА
FRAGS x3|ГРАНАТИ ×3
RESUPPLY|ПОПОВНЕННЯ
SCOUT DRONE|ДРОН-РОЗВІДНИК
FPV DRONE|FPV-ДРОН
HEAVY DRONE|ВАЖКИЙ ДРОН
SEA DRONE|МОРСЬКИЙ ДРОН
SENTRY GUN|АВТОТУРЕЛЬ
FIRE MISSION|АРТУДАР
COMBAT STIM|СТИМУЛЯТОР
FLAMETHROWER|ВОГНЕМЕТ
DRONE JAMMER|ГЛУШНИК ДРОНІВ
REPAIR KIT|РЕМКОМПЛЕКТ
HEAVY PLATE|ВАЖКА БРОНЕПЛИТА
COMBAT VEST|БОЙОВИЙ ЖИЛЕТ
RAILGUN|РЕЙКОТРОН
GOD MODE|РЕЖИМ БОГА
ROBOT DOG|РОБОПЕС
SMOKE|ДИМ
INCENDIARY|ЗАПАЛЮВАЛЬНИЙ ЗАСІБ
BODY ARMOUR|БРОНЕЖИЛЕТ
PILOT|ПІЛОТ
SCOUT|РОЗВІДНИК
HEAVY|ВАЖКИЙ
MOBILE|МОБІЛЬНИЙ
M9 PISTOL|ПІСТОЛЕТ M9
MARKSMAN|СНАЙПЕРСЬКА ГВИНТІВКА
BULLDOG LMG|КУЛЕМЕТ BULLDOG
COMMON|ЗВИЧАЙНЕ
RARE|РІДКІСНЕ
EPIC|ЕПІЧНЕ
LEGENDARY|ЛЕГЕНДАРНЕ
AMMO RESUPPLY|ПОПОВНЕННЯ БОЄЗАПАСУ
AMMO CRATE|ЯЩИК НАБОЇВ
LOOSE ROUNDS|НАБОЇ
FIELD DRESSING|ПЕРЕВ’ЯЗУВАЛЬНИЙ ПАКЕТ
ARMOUR PLATE|БРОНЕПЛИТА
FRAG PACK|НАБІР ГРАНАТ
Load and refill every carried weapon|Зарядити всю наявну зброю та поповнити запас
+1 mag for your weapon|+1 магазин до вашої зброї
Restore 45 health|Відновити 45 здоров’я
+30 armour (soaks damage first)|+30 броні (першою поглинає шкоду)
+2 grenades|+2 гранати
+40 armour|+40 броні
+45 armour|+45 броні
+50 health · to belt|+50 здоров’я · на пояс
three grenades|три гранати
refill every gun|поповнити всю зброю
small blast|малий вибух
medium blast|середній вибух
large blast|великий вибух
ship killer|проти кораблів
15s of fire|15 с вогню
burst kills drones|імпульс знищує дрони
electronic burst|електронний імпульс
to belt|на пояс
goes to your belt|додається на пояс
+25% integrity · anywhere inside base|+25% міцності · будь-де на базі
+25% integrity · use inside base|+25% міцності · використайте на базі
+25% base integrity · use inside base|+25% міцності бази · використайте на базі
armour cap 120|максимум броні: 120
health 140|здоров’я: 140
3 piercing shots|3 наскрізні постріли
face tool · invulnerable / unlimited ammo|невразливість / необмежені набої
BELT FULL|ПОЯС ЗАПОВНЕНО
USE A TOOL FIRST|СПОЧАТКУ ВИКОРИСТАЙТЕ ЗАСІБ
GOD MODE ALREADY OWNED|РЕЖИМ БОГА ВЖЕ ПРИДБАНО
GOD MODE OFF|РЕЖИМ БОГА ВИМКНЕНО
GOD MODE ACTIVATED|РЕЖИМ БОГА УВІМКНЕНО
GOD ON|БОГ: УВІМК.
GOD OFF|БОГ: ВИМК.
NORMAL PLAYER ACTIVE · SELECT FACE TO REACTIVATE|ЗВИЧАЙНИЙ БОЄЦЬ · НАТИСНІТЬ ОБЛИЧЧЯ ДЛЯ АКТИВАЦІЇ
PLAYER RETURNED TO BASE · UNLIMITED AMMO & FRAGS|БОЄЦЬ НА БАЗІ · НЕОБМЕЖЕНІ НАБОЇ ТА ГРАНАТИ
PATCHED UP|ПІДЛІКОВАНО
PLATE ON|БРОНЮ НАДЯГНЕНО
BASE AT FULL INTEGRITY|БАЗА ПОВНІСТЮ ВІДНОВЛЕНА
REPAIR KIT SAVED|РЕМКОМПЛЕКТ ЗБЕРЕЖЕНО
BASE REPAIRED|БАЗУ ВІДРЕМОНТОВАНО
WALL REPAIRED|СТІНУ ВІДРЕМОНТОВАНО
NO WALL DAMAGE IN RANGE|ПОРУЧ НЕМАЄ ПОШКОДЖЕНИХ СТІН
MOVE CLOSER TO THE WALL|ПІДІЙДІТЬ БЛИЖЧЕ ДО СТІНИ
STIM|СТИМУЛЯТОР
SPEED + RATE OF FIRE|ШВИДКІСТЬ + ТЕМП ВОГНЮ
HOLD FIRE TO SPRAY|УТРИМУЙТЕ ВОГОНЬ
SENTRY DEPLOYED|ТУРЕЛЬ РОЗГОРНУТО
SMOKE OUT|ДИМОВУ ЗАВІСУ ПОСТАВЛЕНО
THEY CANNOT SEE YOU|ВАС НЕ БАЧАТЬ
ROUNDS INBOUND|СНАРЯДИ НА ПІДЛЬОТІ
NO WATER HERE|ТУТ НЕМАЄ ВОДИ
THE BOAT STAYS ON ITS TRAILER|КАТЕР ЗАЛИШАЄТЬСЯ НА ПРИЧЕПІ
DRONE UPLINK|ЗВ’ЯЗОК ІЗ ДРОНОМ
STEER IN · ACT TO DETONATE|КЕРУЙТЕ · НАТИСНІТЬ ДІЮ ДЛЯ ПІДРИВУ
SEA MINE|МОРСЬКА МІНА
CONTACT DETONATION|КОНТАКТНИЙ ПІДРИВ
DRONE SHOT DOWN|ДРОН ЗБИТО
RETURN TO THE LAUNCH STATION|ПОВЕРНІТЬСЯ ДО ПУСКОВОЇ СТАНЦІЇ
ROBOT DOG BATTERY EMPTY|АКУМУЛЯТОР РОБОПСА РОЗРЯДЖЕНО
RECHARGING AT THE LAUNCH PAD|ЗАРЯДЖАЄТЬСЯ НА ПУСКОВОМУ МАЙДАНЧИКУ
DEPOT HIT|СКЛАД УРАЖЕНО
ARMOUR HIT|БРОНЕТЕХНІКУ УРАЖЕНО
ONE MORE|ЩЕ ОДИН
SAM SITE DESTROYED|ПОЗИЦІЮ ППО ЗНИЩЕНО
IMPACT|ВЛУЧАННЯ
KERCH CROSSING DESTROYED|КЕРЧЕНСЬКУ ПЕРЕПРАВУ ЗНИЩЕНО
CRUISER|КРЕЙСЕР
FRIGATE|ФРЕГАТ
CORVETTE|КОРВЕТ
LANDING SHIP|ДЕСАНТНИЙ КОРАБЕЛЬ
KREMLIN CHECKPOINT|КРЕМЛІВСЬКИЙ БЛОКПОСТ
ARCADE CHECKPOINT|БЛОКПОСТ БІЛЯ ПАСАЖУ
KREMLIN WALL|КРЕМЛІВСЬКА СТІНА
SAINT BASIL’S CATHEDRAL|СОБОР ВАСИЛІЯ БЛАЖЕННОГО
HOT DOGS|ХОТ-ДОГИ
BUS|АВТОБУС
CITY GARDENS|МІСЬКИЙ СКВЕР
UAV OPERATIONS|ЦЕНТР БПЛА
CAPTURE BOTH FLAGS · DESTROY DRONE BASE|ЗАХОПІТЬ ОБИДВА ПРАПОРИ · ЗНИЩТЕ БАЗУ ДРОНІВ
LAUNCH TRUCK BACK UP|ПУСКОВА ВАНТАЖІВКА ЗНОВУ ГОТОВА
LAUNCH TRUCK HIT|ПУСКОВУ ВАНТАЖІВКУ УРАЖЕНО
LAUNCH TRUCK|ПУСКОВА ВАНТАЖІВКА
SOLDIERS FREED|БІЙЦІВ ЗВІЛЬНЕНО
ESCORTING THEM HOME|СУПРОВІД НА БАЗУ
RESCUE GROUP SAFE|ВРЯТОВАНІ В БЕЗПЕЦІ
ENEMY INSIDE HOME BASE|ВОРОГ УСЕРЕДИНІ БАЗИ
ELIMINATE THE ASSAULT TROOPERS|ЗНИЩТЕ ШТУРМОВИКІВ
BASE DESTROYED|БАЗУ ЗНИЩЕНО
MISSION FAILED|МІСІЮ ПРОВАЛЕНО
LAST WEAPON|ОСТАННЯ ЗБРОЯ
CAN'T DROP IT|НЕ МОЖНА ВИКИНУТИ
SECTOR 1 COMPLETE|СЕКТОР 1 ЗАВЕРШЕНО
UNLOCK SECTORS 2–6 TO CONTINUE|ВІДКРИЙТЕ СЕКТОРИ 2–6 ДЛЯ ПРОДОВЖЕННЯ
CONNECTION LOST|ЗВ’ЯЗОК ВТРАЧЕНО
RETRYING SECTOR ACCESS|ПОВТОРНА ПЕРЕВІРКА ДОСТУПУ
BOSS DOWN|БОСА ЗНИЩЕНО
MILITARY AID SECURED|ВІЙСЬКОВУ ДОПОМОГУ ЗАХОПЛЕНО
MEAT GRINDER CLEARED|М’ЯСОРУБКУ ЗАЧИЩЕНО
CRUDE INTENTIONS CLEARED|НАФТОВІ ОБ’ЄКТИ ЗАЧИЩЕНО
FINAL BOSS DEFEATED|ФІНАЛЬНОГО БОСА ПЕРЕМОЖЕНО
RED SQUARE SECURED|ЧЕРВОНУ ПЛОЩУ ЗАХОПЛЕНО
MAN DOWN|БОЄЦЬ ЗАГИНУВ
SQUAD WIPED OUT|ЗАГІН ЗНИЩЕНО
PICKED UP|ПІДІБРАНО
DRONE LOST|ДРОН ВТРАЧЕНО
MINI-NUKE BLAST|МІНІЯДЕРНИЙ ВИБУХ
DRONE HIT BY HAMMER|ДРОН УРАЖЕНО МОЛОТОМ
DRONE HIT BY GRINDER SHOT|ДРОН УРАЖЕНО ПОСТРІЛОМ М’ЯСОРУБКИ
ANOTHER DRONE IS READY|ІНШИЙ ДРОН ГОТОВИЙ
FIRE-BOTTLE IMPACT|ВЛУЧАННЯ ЗАПАЛЮВАЛЬНОЇ ПЛЯШКИ
HOME BASE HIT|НАШУ БАЗУ УРАЖЕНО
GRINDER SHOT|ПОСТРІЛ М’ЯСОРУБКИ
MOVE AWAY FROM THE IMPACT ZONE|ВІДІЙДІТЬ ВІД ЗОНИ ВЛУЧАННЯ
FIRE BOTTLE INBOUND|ЗАПАЛЮВАЛЬНА ПЛЯШКА НА ПІДЛЬОТІ
MOVE OUT OF THE BURN ZONE|ЗАЛИШТЕ ЗОНУ ГОРІННЯ
MINI-NUKE INBOUND|МІНІЯДЕРНИЙ ЗАРЯД НА ПІДЛЬОТІ
CLEAR THE BLAST MARKER|ВІДІЙДІТЬ ВІД ПОЗНАЧКИ ВИБУХУ
HAMMER THROW|КИДОК МОЛОТА
KEEP MOVING|НЕ ЗУПИНЯЙТЕСЯ
FLAMING BARREL|ПАЛАЮЧА БОЧКА
MOVE OUT OF THE TARGET CIRCLE|ВИЙДІТЬ ІЗ КОЛА НАВЕДЕННЯ
AA GUN DOWN|ЗЕНІТКУ ЗНИЩЕНО
ABOARD|НА БОРТУ
STEER OUT · ACT TO FIRE|КЕРУЙТЕ · НАТИСНІТЬ ДІЮ ДЛЯ ВОГНЮ
ASHORE|НА БЕРЕЗІ
SEA DRONE AWAY|МОРСЬКИЙ ДРОН ЗАПУЩЕНО
STEER INTO A HULL|СПРЯМУЙТЕ В КОРПУС КОРАБЛЯ
SECOND WAVE|ДРУГА ХВИЛЯ
MORE COMMANDERS|НОВІ КОМАНДИРИ
THE LINE IS BROKEN|ЛІНІЮ ПРОРВАНО
TAKE THEIR HEADQUARTERS|ЗАХОПІТЬ ЇХНІЙ ШТАБ
DRONE SORTIE|ВИЛІТ ДРОНА
SHOOT IT DOWN OR JAM IT|ЗБИЙТЕ АБО ЗАГЛУШІТЬ ЙОГО
TAKE THE POLE|ЗАХОПІТЬ ФЛАГШТОК
LOWERING THEIR COLOURS|СПУСКАЄМО ВОРОЖИЙ ПРАПОР
HOLD THE POLE|УТРИМУЙТЕ ФЛАГШТОК
COLOURS DOWN|ВОРОЖИЙ ПРАПОР СПУЩЕНО
BURN THEM|СПАЛІТЬ ЇХ
ARMOUR INBOUND|БРОНЕТЕХНІКА НАБЛИЖАЄТЬСЯ
ONLY A DRONE WILL STOP IT|ЛИШЕ ДРОН ЇЇ ЗУПИНИТЬ
ARMOUR DESTROYED|БРОНЕТЕХНІКУ ЗНИЩЕНО
ROAD AND RAIL SPANS COLLAPSING|АВТОМОБІЛЬНІ ТА ЗАЛІЗНИЧНІ ПРОГОНИ ОБВАЛЮЮТЬСЯ
GUNBOAT SUNK|БОЙОВИЙ КАТЕР ЗАТОПЛЕНО
REPLACEMENT AT THE DOCK IN 12 SECONDS|НОВИЙ КАТЕР БІЛЯ ПРИЧАЛУ ЧЕРЕЗ 12 СЕКУНД
GUNBOAT READY|БОЙОВИЙ КАТЕР ГОТОВИЙ
REPLACEMENT AT THE DOCK|НОВИЙ КАТЕР БІЛЯ ПРИЧАЛУ
BIRD STRIKE|ЗІТКНЕННЯ З ПТАХОМ
DRONE DAMAGED|ДРОН ПОШКОДЖЕНО
FUEL|ПАЛЬНЕ
ENEMY LANDING|ВОРОЖИЙ ДЕСАНТ
TROOPS COMING ASHORE|ВІЙСЬКА ВИСАДЖУЮТЬСЯ
LANDING FORCE ASHORE|ДЕСАНТ НА БЕРЕЗІ
DEFEND THE BASE|ЗАХИЩАЙТЕ БАЗУ
SHIP SAM LAUNCH|ПУСК КОРАБЕЛЬНОЇ ППО
MISSILE TRACKING DRONE|РАКЕТА ПЕРЕСЛІДУЄ ДРОН
HOME BASE UNDER ATTACK|НАШУ БАЗУ АТАКУЮТЬ
ENEMY COMMANDER ENTERS THE FIGHT|ВОРОЖИЙ КОМАНДИР ВСТУПАЄ В БІЙ
FINAL BOSS|ФІНАЛЬНИЙ БОС
PUTIN ENTERS FROM THE KREMLIN|ПУТІН ВИХОДИТЬ ІЗ КРЕМЛЯ
ENEMY DRONES LAUNCHED|ВОРОЖІ ДРОНИ ЗАПУЩЕНО
DEFEND HOME · DESTROY THE DRONE COMMAND UNIT|ЗАХИЩАЙТЕ БАЗУ · ЗНИЩТЕ ЦЕНТР КЕРУВАННЯ ДРОНАМИ
UKRAINIAN FLAG RAISED|УКРАЇНСЬКИЙ ПРАПОР ПІДНЯТО
BOSS ARENA OPEN|АРЕНУ БОСА ВІДКРИТО
ENTER THE CEREMONIAL COURT|УВІЙДІТЬ ДО ПАРАДНОГО ДВОРУ
DRONE BASE DESTROYED|БАЗУ ДРОНІВ ЗНИЩЕНО
ENEMY LAUNCHES STOPPED|ВОРОЖІ ЗАПУСКИ ПРИПИНЕНО
PATROL TANK DESTROYED|ПАТРУЛЬНИЙ ТАНК ЗНИЩЕНО
REFINERY DESTROYED|НАФТОПЕРЕРОБНИЙ ЗАВОД ЗНИЩЕНО
REFINERY DOWN|НАФТОПЕРЕРОБНИЙ ЗАВОД ЗНИЩЕНО
MISSILE INBOUND|РАКЕТА НА ПІДЛЬОТІ
BASE MISSILE WARNING|РАКЕТНА ЗАГРОЗА ДЛЯ БАЗИ
SAM LAUNCH|ПУСК ППО
BREAK AWAY|УХИЛЯЙТЕСЯ
WEAPONS AND TROOPS ON THE APRON|ЗБРОЯ ТА ВІЙСЬКА НА ПЕРОНІ
5 SECONDS · DEFEND THE BASE EXITS|5 СЕКУНД · ЗАХИЩАЙТЕ ВИХОДИ З БАЗИ
ENEMIES TAKING POSITIONS OUTSIDE THE BASE|ВОРОГИ ЗАЙМАЮТЬ ПОЗИЦІЇ ПОЗА БАЗОЮ
FRAG SHOT DOWN|ГРАНАТУ ЗБИТО
THE GUNS COVER THE DUMP|СКЛАД ПРИКРИВАЮТЬ ГАРМАТИ
ENEMY HUB LAUNCHING|ВОРОЖИЙ ЦЕНТР ЗАПУСКАЄ ДРОНИ
DRONES TARGETING YOU AND HOME BASE|ДРОНИ АТАКУЮТЬ ВАС І НАШУ БАЗУ
DRONE INBOUND|ДРОН НАБЛИЖАЄТЬСЯ
SHOOT IT DOWN|ЗБИЙТЕ ЙОГО
JAMMER FIRED|ГЛУШНИК АКТИВОВАНО
DRONES DOWN|ДРОНИ ЗБИТО
DRONE ONLY|ЛИШЕ ДРОН
AMMO DEPOT CHAIN REACTION|ЛАНЦЮГОВА ДЕТОНАЦІЯ БОЄСКЛАДУ
GET CLEAR|ВІДІЙДІТЬ
COUNTERATTACK|КОНТРАТАКА
THEY ARE RUSHING THE POLE|ВОРОГИ ШТУРМУЮТЬ ФЛАГШТОК
BASE ASSAULT TROOPER|ШТУРМОВИК БАЗИ
INTERCEPT BEFORE HE REACHES HOME|ПЕРЕХОПІТЬ ЙОГО ДО ПІДХОДУ ДО БАЗИ
RED SQUARE|ЧЕРВОНА ПЛОЩА
MOSCOW|МОСКВА
THREE ROUTES THROUGH RED SQUARE|ТРИ МАРШРУТИ ЧЕРЕЗ ЧЕРВОНУ ПЛОЩУ
KREMLIN LANE|КРЕМЛІВСЬКИЙ ПРОВУЛОК
KREMLIN APPROACH|ПІДСТУПИ ДО КРЕМЛЯ
CENTRAL PLAZA|ЦЕНТРАЛЬНА ПЛОЩА
SHOPPING ARCADE|ТОРГОВИЙ ПАСАЖ
CEREMONIAL COURT|ПАРАДНИЙ ДВІР
SECURE TWO CHECKPOINTS|ЗАХОПІТЬ ДВА БЛОКПОСТИ
LOWER ENEMY FLAGS · RAISE UKRAINIAN FLAGS|СПУСТІТЬ ВОРОЖІ ПРАПОРИ · ПІДНІМІТЬ УКРАЇНСЬКІ
DESTROY THE DRONE BASE|ЗНИЩТЕ БАЗУ ДРОНІВ
BOTH FLAGS + DRONE COMMAND UNIT OPEN THE BOSS COURT|ОБИДВА ПРАПОРИ ТА ЗНИЩЕНИЙ ЦЕНТР ДРОНІВ ВІДКРИЮТЬ ШЛЯХ ДО БОСА
MILITARY AID|ВІЙСЬКОВА ДОПОМОГА
THREE CARGO PLANES UNLOADING|РОЗВАНТАЖУЮТЬСЯ ТРИ ВАНТАЖНІ ЛІТАКИ
NORTH KOREAN WEAPONS AND TROOPS|ПІВНІЧНОКОРЕЙСЬКІ ЗБРОЯ ТА ВІЙСЬКА
MOBILE GUARDS AROUND EVERY PLANE|РУХОМІ ПАТРУЛІ БІЛЯ КОЖНОГО ЛІТАКА
BREAK THE DEFENSIVE PATROLS|ЗНИЩТЕ ОБОРОННІ ПАТРУЛІ
TWO ASSAULT WAVES WILL HIT BASE|БАЗУ АТАКУЮТЬ ДВІ ШТУРМОВІ ХВИЛІ
DEFEAT BOTH AND CLEAR MILITARY AID|ВІДБИЙТЕ ОБИДВІ ХВИЛІ ТА ЗАЧИСТЬТЕ СЕКТОР
CRUDE INTENTIONS|НАФТОВІ НАМІРИ
SIX REFINERIES · 6 PATROL TANKS|ШІСТЬ НАФТОЗАВОДІВ · 6 ПАТРУЛЬНИХ ТАНКІВ
DESTROY ALL PLANTS AND TANKS TO REVEAL THE BOSS|ЗНИЩТЕ ВСІ ЗАВОДИ Й ТАНКИ, ЩОБ З’ЯВИВСЯ БОС
MOBILE LAUNCH: NORTHWEST|МОБІЛЬНИЙ ПУСК: ПІВНІЧНИЙ ЗАХІД
PARKED TRUCK · HEAVY DRONE FORMATION|ПРИПАРКОВАНА ВАНТАЖІВКА · ГРУПА ВАЖКИХ ДРОНІВ
SAM SITES ON EVERY PLANT|ПОЗИЦІЇ ППО НА КОЖНОМУ ЗАВОДІ
BREAK WHEN THEY LAUNCH|УХИЛЯЙТЕСЯ ПІСЛЯ ПУСКУ
THEY ARE SHELLING THE BASE|БАЗУ ОБСТРІЛЮЮТЬ
WORK FAST|ДІЙТЕ ШВИДКО
BLACK SEA FLEET|ЧОРНОМОРСЬКИЙ ФЛОТ
SEVEN SHIPS OFFSHORE|СІМ КОРАБЛІВ БІЛЯ УЗБЕРЕЖЖЯ
SINK THEM ALL|ПОТОПІТЬ ЇХ УСІ
AIR AND SEA DRONES|ПОВІТРЯНІ ТА МОРСЬКІ ДРОНИ
LAUNCH FROM THE SLIPWAY|ЗАПУСКАЙТЕ ЗІ СЛІПА
TWO LANDING SHIPS INBOUND|НАБЛИЖАЮТЬСЯ ДВА ДЕСАНТНІ КОРАБЛІ
STOP THE TROOPS REACHING SHORE|НЕ ДАЙТЕ ВІЙСЬКАМ ДІСТАТИСЯ БЕРЕГА
DESTROY KERCH BRIDGE|ЗНИЩТЕ КЕРЧЕНСЬКИЙ МІСТ
HEAVY DRONE + OIL TRAIN = CHAIN REACTION|ВАЖКИЙ ДРОН + ПОЇЗД ІЗ ПАЛЬНИМ = ЛАНЦЮГОВА РЕАКЦІЯ
MEAT GRINDER|М’ЯСОРУБКА
TWO ENEMY BASES|ДВІ ВОРОЖІ БАЗИ
CLEAR AND CAPTURE BOTH|ЗАЧИСТЬТЕ ТА ЗАХОПІТЬ ОБИДВІ
PRISONERS IN EACH BASE|ПОЛОНЕНІ НА КОЖНІЙ БАЗІ
FREE THEM AND GET THEM HOME|ЗВІЛЬНІТЬ ЇХ І ПОВЕРНІТЬ НА БАЗУ
TWO WEAPONS DEPOTS|ДВА СКЛАДИ ЗБРОЇ
3 HEAVY DRONE HITS EACH · DETONATE INSIDE|ПО 3 УДАРИ ВАЖКИМ ДРОНОМ · ПІДРИВАЙТЕ ВСЕРЕДИНІ
LAUNCH TRUCK DEPLOYING|ПУСКОВА ВАНТАЖІВКА РОЗГОРТАЄТЬСЯ
PROTECTED FOR 12 SECONDS|ЗАХИЩЕНО НА 12 СЕКУНД
FRANKS AND HAMMERS|ФРАНКИ ТА МОЛОТИ
BREACH 3 COMPOUND PERIMETERS|ПРОРВІТЬ ПЕРИМЕТРИ 3 УКРІПЛЕНЬ
TAKE EACH FORTIFIED POSITION|ЗАХОПІТЬ КОЖНУ УКРІПЛЕНУ ПОЗИЦІЮ
NEUTRALIZE ENEMY FORCES|ЗНЕШКОДЬТЕ ВОРОЖІ СИЛИ
CLEAR ALL HOSTILES|ЗНИЩТЕ ВСІХ ВОРОГІВ
DESTROY THE ENEMY DRONE BASE|ЗНИЩТЕ ВОРОЖУ БАЗУ ДРОНІВ
TOP-LEFT HOUSE · STOP BOTH LAUNCH STATIONS|БУДИНОК УГОРІ ЛІВОРУЧ · ЗНИЩТЕ ОБИДВІ ПУСКОВІ СТАНЦІЇ
ELIMINATE LEVEL ONE BOSS|ЗНИЩТЕ БОСА ПЕРШОГО СЕКТОРА
CAPTURE ALL BASES AND DESTROY THE DRONE HUB FIRST|СПОЧАТКУ ЗАХОПІТЬ УСІ БАЗИ ТА ЗНИЩТЕ ЦЕНТР ДРОНІВ
RECONNECT TO CONTINUE|ВІДНОВІТЬ ЗВ’ЯЗОК ДЛЯ ПРОДОВЖЕННЯ
SECTOR CLEAR|СЕКТОР ЗАЧИЩЕНО
WOODLAND|ЛІС
URBAN|МІСТО
RANGER|РЕЙНДЖЕР
DESERT|ПУСТЕЛЯ
NIGHT|НІЧ
LIVE · FPV CAMERA|НАЖИВО · FPV-КАМЕРА
BUILDING COVER|БУДУЄ УКРИТТЯ
HOLD TO BOARD|ЗАТРИМАЙТЕСЯ ДЛЯ ПОСАДКИ
STOP TO STEP ASHORE|ЗУПИНІТЬСЯ ДЛЯ ВИСАДКИ
GET BACK IN THE CIRCLE|ПОВЕРНІТЬСЯ В КОЛО
CONTESTED — CLEAR THE CIRCLE|ВОРОГ ПОРУЧ — ЗАЧИСТЬТЕ КОЛО
DRONE HEALTH|МІЦНІСТЬ ДРОНА
MISSION OBJECTIVES|ЗАВДАННЯ МІСІЇ
LEAVE|ЗАЛИШИТИ
TAKE|ВЗЯТИ
EQUIP|ОЗБРОЇТИСЯ
tap anywhere outside to skip|натисніть поза карткою, щоб пропустити
STAND HERE TO TRADE|СТАНЬТЕ ТУТ ДЛЯ ТОРГІВЛІ
SCOUT SURVEILLANCE|РОЗВІДКА ДРОНОМ
LINK|ЗВ’ЯЗОК
REC|ЗАПИС
BOT|БОТ
HEAVY DRONE CONTROL|КЕРУВАННЯ ВАЖКИМ ДРОНОМ
FPV MISSION CONTROL|КЕРУВАННЯ FPV
IN FLIGHT|У ПОЛЬОТІ
ACTIVATE|АКТИВУВАТИ
STAND IN THE BAY|СТАНЬТЕ НА МАЙДАНЧИК
BUILDING|ЗБІРКА
DAMAGE|ШКОДА
FIRE RATE|ТЕМП ВОГНЮ
RATE|ТЕМП
MAGAZINE|МАГАЗИН
SUPPLY|ЗАПАС
PENETRATION|ПРОБИТТЯ
ALL TARGETS + TERRAIN|УСІ ЦІЛІ ТА ПЕРЕШКОДИ
ALL WEAPONS · MAGAZINES + RESERVES|УСЯ ЗБРОЯ · МАГАЗИНИ ТА ЗАПАС
TOOL|ЗАСІБ
BLAST|ВИБУХ
DURATION|ТРИВАЛІСТЬ
EFFECT|ЕФЕКТ
ROUNDS|НАБОЇ
AMMO|НАБОЇ
ALL WEAPONS RESUPPLIED|УСЮ ЗБРОЮ ПОПОВНЕНО
REFINERIES DOWN|НАФТОЗАВОДІВ ЗНИЩЕНО
TANKS LEFT|ТАНКІВ ЗАЛИШИЛОСЯ
SAM|ППО
CHECKPOINTS|БЛОКПОСТИ
DRONE BASE|БАЗА ДРОНІВ
DESTROYED|ЗНИЩЕНО
ACTIVE|АКТИВНА
FINAL BOSS ACTIVE|ФІНАЛЬНИЙ БОС У БОЮ
BOSS LOCKED|БОС НЕДОСТУПНИЙ
BOSS ACTIVE|БОС У БОЮ
CARGO PLANES|ВАНТАЖНИХ ЛІТАКІВ
ASSAULTS|ШТУРМИ
NK TROOPS|БІЙЦІВ КНДР
SHIPS AFLOAT|КОРАБЛІВ НА ПЛАВУ
SHORE TROOPS|БІЙЦІВ НА БЕРЕЗІ
BRIDGE|МІСТ
DOWN|ЗНИЩЕНО
BASES|БАЗИ
RESCUES|ПОРЯТУНОК
DEPOTS|СКЛАДИ
KERCH BRIDGE|КЕРЧЕНСЬКИЙ МІСТ
REFINERY|НАФТОЗАВОД
WEAPONS DEPOT|СКЛАД ЗБРОЇ
DEPOT|СКЛАД
HEAVY HITS LEFT|УДАРІВ ВАЖКИМ ДРОНОМ ЗАЛИШИЛОСЯ
AA MOUNTS ACTIVE|АКТИВНИХ ЗЕНІТОК
GUNS SILENCED — PUT ONE INSIDE|ЗЕНІТКИ ЗНИЩЕНО — ВЛУЧІТЬ УСЕРЕДИНУ
STAND AT FLAG TO CAPTURE|СТАНЬТЕ БІЛЯ ПРАПОРА ДЛЯ ЗАХОПЛЕННЯ
CLEAR NEARBY GUARDS|ЗНИЩТЕ ОХОРОНУ ПОРУЧ
LOWERING ENEMY FLAG|СПУСК ВОРОЖОГО ПРАПОРА
RAISING UKRAINIAN FLAG|ПІДНЯТТЯ УКРАЇНСЬКОГО ПРАПОРА
RECOVERING|ВІДНОВЛЕННЯ
DEPLOYING|РОЗГОРТАННЯ
STAND HERE TO FREE|СТАНЬТЕ ТУТ ДЛЯ ЗВІЛЬНЕННЯ
CAPTURED SOLDIERS|ПОЛОНЕНІ БІЙЦІ
HEALING|ЛІКУВАННЯ
FIELD AID|МЕДДОПОМОГА
DEMOLITION|ПІДРИВ
BATTERY|АКУМУЛЯТОР
FLIGHT|ПОЛІТ
TAP TO SKIP|НАТИСНІТЬ, ЩОБ ПРОПУСТИТИ
CONTINUE TO NEXT SECTOR|ДАЛІ ДО НАСТУПНОГО СЕКТОРА
RETURN TO BASE|ПОВЕРНУТИСЯ НА БАЗУ
CHOOSE YOUR KIT|ОБЕРІТЬ СПОРЯДЖЕННЯ
EYES UP|ДИВІТЬСЯ ВГОРУ
REDEPLOY|ПОВТОРИТИ
K.I.A.|ЗАГИНУВ У БОЮ
THE HOUSE HOLDS|БУДИНОК ЩЕ ТРИМАЄТЬСЯ
CLEARED|ЗАЧИЩЕНО
THE GROUND IS YOURS|ТЕРИТОРІЯ ВАША
BASE LOST|БАЗУ ВТРАЧЕНО
THEY SHELLED IT FLAT|БАЗУ ЗНИЩЕНО ОБСТРІЛОМ
ALL FIVE DOWN|УСІ П’ЯТЕРО ЗАГИНУЛИ
Base integrity|Міцність бази
Sector reached|Досягнутий сектор
Hostiles down|Знищено ворогів
Squad lost|Втрати загону
Cash lifted|Зібрано коштів
Time on target|Час операції
BACK|НАЗАД
HIGH PRESSURE|ВИСОКИЙ ТИСК
PROCESS UNIT|ТЕХНОЛОГІЧНИЙ БЛОК
ADVANCING|ПРОСУВАННЯ
`;
var catalog=Object.create(null);
pairs.trim().split('\n').forEach(function(line){var at=line.indexOf('|');catalog[line.slice(0,at)]=line.slice(at+1);});
var keys=Object.keys(catalog).sort(function(a,b){return b.length-a.length;});
var pattern=new RegExp('(^|[^A-Za-z])('+keys.map(function(k){return k.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');}).join('|')+')(?=$|[^A-Za-z])','g');
var cache=new Map();
function translate(value){
  var text=String(value);if(cache.has(text))return cache.get(text);
  var result=Object.prototype.hasOwnProperty.call(catalog,text)?catalog[text]:text.replace(pattern,function(_,prefix,key){return prefix+catalog[key];});
  if(cache.size>2000)cache.clear();cache.set(text,result);return result;
}
if(typeof module!=='undefined'&&module.exports){module.exports={translate:translate,catalog:catalog};return;}
if(!root||!root.document)return;
var language='en';try{language=root.localStorage.getItem('gd_language')==='uk'?'uk':'en';}catch(e){}
var originals=new WeakMap(),doc=root.document;
function textNode(node){
  if(!node.parentElement||node.parentElement.closest('script,style,[data-no-translate]'))return;
  var record=originals.get(node),current=node.nodeValue;
  if(!record||current!==record.output)record={source:current,output:current};
  var output=language==='uk'?translate(record.source):record.source;
  record.output=output;originals.set(node,record);
  if(current!==output)node.nodeValue=output;
}
function scan(node){
  if(node.nodeType===3){textNode(node);return;}
  var walker=doc.createTreeWalker(node,4),text;while((text=walker.nextNode()))textNode(text);
}
var observer=new MutationObserver(function(records){
  observer.disconnect();records.forEach(function(r){if(r.type==='characterData')textNode(r.target);else r.addedNodes.forEach(scan);});observe();
});
function observe(){observer.observe(doc.body,{childList:true,subtree:true,characterData:true});}
function setLanguage(next){
  if(next!=='en'&&next!=='uk')return;
  language=next;doc.documentElement.lang=language;
  observer.disconnect();scan(doc.body);observe();
}
// Hook only this standalone game's canvas realm, including dynamically created card canvases.
// Measuring uses the same translated text as painting to preserve layout calculations.
var proto=root.CanvasRenderingContext2D&&root.CanvasRenderingContext2D.prototype;
if(proto)['fillText','strokeText','measureText'].forEach(function(method){
  var original=proto[method];proto[method]=function(text){
    var args=Array.prototype.slice.call(arguments);if(language==='uk')args[0]=translate(text);
    return original.apply(this,args);
  };
});
root.addEventListener('message',function(e){if(e.origin===root.location.origin&&e.source===root.parent&&e.data&&e.data.type==='gd:language')setLanguage(e.data.language);});
root.addEventListener('storage',function(e){if(e.key==='gd_language')setLanguage(e.newValue==='uk'?'uk':'en');});
root.GDLanguage={translate:function(value){return language==='uk'?translate(value):value;},setLanguage:setLanguage};
setLanguage(language);
})(typeof window==='undefined'?null:window);
