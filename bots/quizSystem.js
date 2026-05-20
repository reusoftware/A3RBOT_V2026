const {
    loadJSON,
    saveJSON
} = require("./storage");

let active = {};
let timers = {};

// =====================================
// DEFAULT QUESTIONS
// format:
// question~answer#question~answer
// =====================================

const defaultQuestions = "Start With 'p'~paper#Start With 'p'~power# start with 'o'~our# start with 'u'~usual# start with 'r'~rise#start with 'b'~boy# start with 'b'~bake# start with 'm'~moon# start with 'p'~park# Start With 'd'~driving# start with 'l'~lay# start with 'a'~aunt# start with 'c'~climb# start with 'l'~lead# start with 'h'~hi# Start With 'f'~fellow# start with 'f'~farm#start with 's'~slope# start with 'p'~panel# start with 'p'~proof# start with 'w'~wide#Start With 's'~science# start with 'm'~moon# start with 'a'~agree# start with 't'~toxic# start with 'f'~flag# start with 'a'~add#start with 's'~such#start with 's'~sigh#Start With 'b'~bite# start with 't'~teen#Start With 'l'~love# start with 's'~spill# Start With 'd'~dam#Start With 'm'~minister# start with 'd'~dam# start with 'l'~link#start with 'd'~desk# start with 'l'~lamp# start with 'e'~easy# start with 'b'~brass#start with 'n'~next#start with 'e'~enact# start with 'w'~wheat# start with 'g'~go# start with 'n'~nod# start with 'l'~lower# start with 'p'~pool#Start With 'c'~crown#Start With 'b'~ban# start with 's'~strip#Start With 'f'~facebook# start with 's'~side#start with 'a'~after# start with 'c'~corn# start with 'b'~brake# start with 's'~soil# start with 'p'~past# start with 'o'~organ# start with 'c'~cap# start with 't'~tight#Start With 'c'~claw# start with 'a'~actor# start with 'l'~look# Start With 'a'~away#Start With 'b'~bed#start with 'd'~deer# start with 'f'~fish# start with 'p'~part#start with 'k'~key# start with 'l'~lake# start with 'm'~mine# start with 't'~take# start with 'w'~wake# start with 'd'~deer# start with 'd'~dutch# start with 'g'~gift#Start With 'f'~fire#Start With 'e'~england#start with 'i'~iron#start with 'n'~night#start with 'p'~pump#start with 'a'~adopt#start with 'h'~host#start with 'p'~pole#start with 'g'~grape#start with 's'~scan#start with 'g'~game#start with 'e'~egg#start with 'f'~form#start with 'm'~made#Start With 'c'~cort#start with 'b'~brief#start with 'r'~riot#start with 'y'~yes# start with 's'~swim#start with 'f'~flee#Start With 'q'~quality#start with 'f'~for#start with 'f'~fat#start with 'l'~lame#start with 'g'~got#start with 'b'~bring#start with 'o'~occur#start with 'p'~part#start with 't'~title#start with 'r'~round#start with 's'~storm#Start With 'd'~door#start with 's'~sand#start with 'p'~pole#start with 's'~seat#start with 'b'~both#Start With 'c'~country#start with 'o'~only# start with 't'~tide#start with 'y'~year#start with 'o'~on#start with 'c'~comb#Start With 'f'~flip#start with 'c'~close#start with 'b'~bind#Start With 'f'~faster# start with 'b'~book#start with 's'~step#start with 's'~slam#Start With 'd'~danger#start with 'c'~cry#start with 't'~toy#start with 'f'~fork#start with 'f'~flat#start with 'n'~news#start with 's'~say#start with 'f'~feel#start with 's'~such#start with 'l'~less#Start With 'c'~card#start with 'r'~rude#start with 'e'~empty#start with 'b'~block#Start With 'f'~fight#start with 'u'~unit#start with 'h'~hire#start with 's'~sure#start with 'h'~help#Start With 't'~tea# start with 'e'~else#start with 's'~shift#Start With 'l'~letter#Start With 'c'~crack#start with 'm'~meat#start with 'o'~ocean#start with 'p'~path#start with 's'~slice#start with 'd'~dike#start with 'g'~gas#start with 't'~trade#start with 'w'~wrap#start with 's'~stem#start with 'm'~metal#start with 'p'~pour#start with 'n'~neat#start with 'b'~by# start with 's'~soil#start with 'w'~wage#start with 'o'~our#Start With 'b'~building#start with 'e'~elite#start with 't'~throw#start with 'p'~pay#start with 'h'~hook#Start With 'b'~bowl#start with 'e'~envy#start with 'h'~human#start with 's'~sink#Start With 'm'~marvelous#start with 't'~tool#start with 'o'~only#Start With 'w'~wing#start with 'p~pilot#start with 't'~tour#Start With 'k'~killer#start with 'o'~orbit#start with 'c'~cut#start with 'd'~dna#start with 'd'~draw#start with 'l'~lime#start with 'd'~dead#start with 's'~sure#start with 'f'~fool#start with 's'~smash#start with 'h'~hot#start with 'w'~well#start with 'f'~fair#start with 'c'~cycle#Start With 'c'~clock#start with 's'~save#start with 'e'~east#Start With 'd'~driving#start with 'r'~rich#start with 'p'~page#start with 'c'~check#Start With 'b'~bar#start with 'w'~wake#start with 'm'~moral#Start With 'e'~energetic#start with 'l'~level#start with 's'~she#start with 'a'~aim#Start With 'd'~don#Start With 'r'~║rocket#start with 'p'~plus#start with 'w'~wel#start with 'n'~nest#start with 'p'~press#Start With 'f'~friendly# start with 'r'~race#start with 'g'~gang#start with 'h'~home#Start With 'f'~following#Start With 'n'~nepal# start with 'n'~next# start with 'n'~name#start with 't'~tight#Start With 'd'~dead#start with 'h'~horse#start with 'f'~food#start with 'a'~apart#start with 'h'~honor#start with 'l'~live#start with 'f'~feel#start with 'f'~forum#start with 'h'~help#start with 'f'~from#Start With 'e'~elbow#start with 'f'~forum#start with 'b'~bring#Start With 'r'~royal#start with 'a'~ask#start with 'b'~bird#Start With 'r'~red#Start With 'c'~cotton#start with 'm'~mine#start with 'r'~re#start with 'e'~earn#start with 'o'~odd#start with 'p'~purse#Start With 's'~star#start with 'l'~lemon#start with 'c'~cycle#start with 'p'~pat#start with 'f'~from#start with 'b'~bed#start with 'm'~music#Start With 'd'~darling#start with 'p'~pole#start with 's'~sure#start with 'e'~eat#start with 'w'~wear#start with 'p'~pull#start with 'h'~herb#start with 'w'~who#start with 's'~some#start with 'f'~forth#start with 's'~shall#start with 'l'~liver#start with 'm'~mixed#start with 'f'~flee#start with 'f'~fold#start with 'n'~next#start with 't'~throne#Start With 'd'~duck#start with 'c'~chase#start with 'h'~home#start with 'c'~cab#start with 'h'~help#start with 'l'~lemon#start with 'w'~wash#Start With 'd'~dazzling#start with 'c'~cap#start with 't'~troop#start with 'm'~ms#start with 'f'~free#start with 'w'~was#Start With 'b'~by#Start With 'r'~re#start with 'o'~ok#start with 'd'~depth#Start With 'a'~apply#start with 'f'~food#start with 'l'~lock#start with 'b'~boss#start with 'h'~hook#start with 's'~sink#start with 'a'~aside#start with 'r'~rich#start with 'i'~irony#start with 'p'~pick#Start With 'f'~fry#start with 'c'~come#start with 's'~stir#start with 'c'~chair#Start With 'd'~dish#start with 'h'~heat#start with 'r'~real#Start With 'd'~daughter#start with 'c'~candy#start with 'g'~gas#start with 'w'~weak#start with 'd'~daily#Start With 'f'~fan#start with 'a'~am#start with 'f'~fish#Start With 'c'~complex#start with 'd'~drop#start with 'b'~blue#start with 'v'~vote#start with 'f'~from#start with 'b'~bear#start with 't'~tire#start with 'i'~its#Start With 'f'~faster#start with 'b'~book#start with 't'~toss#start with 't'~trim#Start With 'c'~chain#start with 's'~silly#start with 's'~sac#start with 'h'~hook#start with 'p'~push#start with 'a'~acid#start with 'b'~boil#start with 'w'~wing#start with 'h'~half#Start With 's'~song#start with 'f'~flow#start with 'm'~much#start with 'u'~until#start with 'c'~chalk#start with 's'~spill#start with 'c'~click#start with 'h'~hint#start with 'c'~chef#start with 'r'~ray#start with 'c'~claim#start with 'o'~owner#start with 'r'~rest#start with 't'~take#start with 'e'~enemy#Start With 'o'~owner#Start With 'd'~doll#start with 'g'~go#Start With 'd' ~door#start with 'r'~route#start with 's'~seed#Start With 'e'~exit#start with 'r'~real#start with 's'~sad#Start With 'f'~fifty#start with 's'~silly#start with 'k'~kit#start with 'o'~our#start with 'p'~prove#start with 'c'~cat#Start With 's'~sparkling#start with 'c'~cafe#Start With 'f'~fork#start with 'd'~dish#start with 'f'~form#start with 'c'~color#start with 't'~toe#start with 'c'~case#start with 'c'~clip#start with 'b'~blank#Start With 'a'~aamir#Start With 'd'~dam#start with 's'~sir#Start With 's'~song#start with 'l'~lead#start with 'm'~mix#Start With 'n'~naughty#Start With 'm'~marvelous#start with 'k'~knife#start with 's'~sake#Start With 'q'~quality#start with 'n'~next#start with 'd'~drop#start with 'r'~rush#start with 'f'~fool#start with 'p'~pat#start with 'r'~real#start with 's'~storm#Start With 'd'~driver#start with 'g'~grasp#start with 'b'~bar#start with 'h'~honor#start with 'g'~gold#Start With 'p'~power#start with 'l'~lip#start with 'r'~rank#start with 'c'~cook#start with 'b'~born#Start With 'k'~kerala#Start With 'c'~clock#start with 'g'~game#start with 'q'~queen#start with 'l'~load#start with 'c'~cool#start with 'y'~yes#start with 'c'~cycle#start with 'p'~pond#start with 'e'~equal#start with 'f'~flat#start with 'i'~its#Start With 'e'~emotion#start with 't'~trade#start with 'j'~juror#start with 'h'~herb#start with 'r'~rain#start with 'l'~life#start with 'd'~dumb#start with 's'~score#start with 's'~skirt#Start With 'e'~end#start with 'f'~forth#start with 'a'~await#start with 'r'~race#start with 'm'~meat#start with 'g'~grasp#start with 'c'~coin#start with 'w'~wide#start with 'w'~wash#start with 't'~tour#start with 's'~sit#Start With 'f'~facebook#Start With 'b'~born#Start With 'l'~loop#start with 'h'~hall#start with 'd'~dog#start with 'p'~pizza#Start With 'n'~nice#start with 'd'~draw#start with 'a'~acid#start with 'b'~blow#start with 'r'~rain#start with 'n'~note#Start With 'd'~drew#start with 'l'~load#start with 'b'~boss#start with 'i'~issue#start with 'd'~debt#Start With 'f'~fire#Start With 'c'~camb#Start With 'b'~bat#Start With 'f'~four#start with 'a'~apple#start with 'l'~life#start with 'm'~mood# start with 'm'~more#start with 'p'~pin#Start With 'm'~mobile#start with 'n'~nose#start with 'h'~hard#start with 't'~trim#start with 'n'~nurse#start with 'l'~luck# start with 'd'~doll# start with 'p'~plot# start with 'p'~point#start with 'w'~who#start with 'y'~yet#start with 'w'~whom#start with 'f'~fat#Start With 'm'~mount#start with 'i'~ill#Start With 'y'~yellow#Start With 'w'~weather#start with 'r'~run#start with 'o'~off#start with 's'~slice#start with 'd'~drive#start with 'g'~guess#start with 'p'~part#start with 'o'~ocean#start with 'l'~lens#start with 'm'~mine#start with 'm'~much#start with 'o'~once#Start With 'c'~cutter#start with 's'~send#Start With 'd'~drow#start with 'h'~hold#start with 'b'~bent#start with 'm'~most#start with 'b'~beat#Start With 'd'~dear#start with 'b'~bone#start with 'c'~chef#start with 'c'~chin#Start With 't'~ticket#start with 'a'~arena#start with 'c'~come# start with 'd'~dull#start with 'w'~wet#start with 'i'~inch#start with 'b'~ball#start with 'p'~pale#Start With 'f'~four#start with 'c'~come#Start With 's'~science#start with 'g'~gift#start with 's'~shore#start with 'c'~chest#Start With 'c'~cort#start with 'u'~until#start with 'r'~rest#start with 't'~toxic#start with 's'~soil#start with 'p'~pitch#start with 'b'~base#Start With 'm'~multipurpose#start with 's'~stop#start with 't'~taxi#start with 'r'~rush#start with 'w'~wash#start with 's'~she#start with 'c'~can#Start With 'p'~potato#start with 'u'~ugly#start with 't'~tall#Start With 'e'~elbow#start with 's'~set#start with 'a'~along#Start With 'c'~clock#start with 'h'~human#start with 'r'~root#start with 'l'~less#Start With 'k'~knife#start with 'm'~most#start with 'e'~ever#Start With 's'~star#start with 'w'~week#start with 'r'~ready#start with 'w'~weak#Start With 'b'~business#start with 'r' ~rise#Start With 'f'~faimous#start with 'c'~chief#start with 's'~short#start with 'd'~dead#Start With 'b'~beef#start with 's'~shoe#start with 'd'~delay#start with 'h'~hot#Start With 'e'~enter#start with 'i'~ill#Start With 'e' ~entry#start with 'o' ~okay#start with 'b'~boil#Start With 's'~science#start with 's'~song#start with 'p'~park#start with 'l'~land#start with 'c'~cycle#start with 'c'~cool#start with 't'~type#start with 'w'~wild#start with 's'~silk#start with 'b'~bed#start with 'd'~dead#start with 'p'~prove#start with 'd'~doll#Start With 's'~spelling#start with 'p'~party#start with 'c'~cut#Start With 'c'~cotton#start with 'p'~pan#start with 't'~type#Start With 's'~silent#start with 's'~sigh#start with 'y'~yet#Start With 'd'~door#start with 's'~same#Start With 'f'~fever#start with 'o'~ought#Start With 'q'~question#Start With 'b'~photo#start with 's'~space#start with 'a'~allow#start with 's'~send#Start With 'm'~morning#start with 'p'~pay#start with 'p'~pen#Start With 'b'~bowl#Start With 'i'~india#start with 'q'~queen#Start With 's'~spelling#start with 'l'~look#start with 's'~set#start with 'b'~bike#start with 's'~sure#Start With 'b'~brb#start with 'a'~add#start with 'b'~block#start with 'h'~honey#start with 'n'~night#start with 'b'~beat#start with 'h'~ha#start with 'p'~peace#start with 'e'~ego#Start With 'l'~language#start with 'u'~uh#start with 'c'~code#start with 'o'~ocean#start with 'a'~alone#start with 'p'~play#start with 'b'~buyer#Start With 'w'~wonderful#Start With 't'~transport#start with 'a'~arena#Start With 'm'~minister#start with 'u'~union#start with 'p'~panel#Start With 'f'~flip#start with 'd'~deer#Start With 's'~superman#Start With 'e'~east#start with 'w'~wet#start with 'a'~awake#Start With 's'~serious#start with 's'~spray#start with 'e'~egg#start with 'p'~poor#start with 'p'~point#start with 't'~test#start with 'c'~cat#start with 'n'~note#start with 'h'~hear#start with 'g'~gay#start with 'p'~push#start with 'k'~knot#start with 'l'~loose#start with 'w'~world#Start With 'q'~quality#start with 'f'~from#start with 'm'~mixed#Start With 'n'~naughty#start with 'm'~most#start with 'b'~book#Start With 'b'~bear#start with 'c'~cut#start with 'f'~fast#Start With 'p'~potato#start with 'f'~from#start with 'p'~proof#Start With 'h'~hindi#start with 'f'~fame#Start With 'e'~earn#Start With 's'~scooter#start with 'a'~aunt#start with 'a'~arm#start with 'd'~drop#Start With 'u'~umbrella#start with 'f'~fork#Start With 'b'~better#Start With 'l'~loop#start with 'd'~dog#start with 'h'~hole#start with 's'~spill#Start With 'f'~friendly#start with 'y'~yet#start with 'h'~heat#start with 'v'~vote#Start With 't'~tea#start with 'h'~home#start with 'p'~palm#Start With 'f'~friendly#Start With 'c'~chain#Start With 't'~transport#start with 'i'~inch#start with 'd'~deep#start with 'm'~milk#start with 'r'~rest#start with 'p'~point#Start With 'h'~happy#start with 'u'~unite#Start With 'a'~aunty#start with 'w'~wide#Start With 'e'~end#start with 'f'~farm#start with 't'~too#start with 'd'~drink#start with 't'~tile#Start With 'c'~call#start with 'm'~more#Start With 'c'~cort#start with 'c'~chase#Start With 's'~sing#start with 'l'~lucky#Start With 'e'~earn#start with 'z'~zinc#Start With 'k'~king#start with 'n'~now#start with 'e'~each#Start With 'e'~edit#start with 's'~soil#start with 'h'~half#start with 't'~trash#start with 'w'~wash#start with 'i'~is#start with 'c'~cover#start with 'w'~while#Start With 'f'~fast#start with 't'~thumb#start with 'f'~fly#start with 'c'~coin#Start With 'l'~lime#Start With 's'~silent#start with 'u'~union#start with 'e'~etc#start with 's'~soft#start with 'i'~idea#start with 'p'~piano#start with 'c'~cry#start with 'p'~panel#start with 'c'~color#start with 't'~tune#Start With 'c'~click#Start With 'b'~bot#start with 'f'~food#start with 'k'~kiss#start with 'l'~life#start with 'v' ~virus#start with 's'~stop#start with 'f'~fee#start with 'b'~bride#start with 'g'~grasp#Start With 'f'~flot#start with 'l'~lazy#Start With 'e'~england#start with 'p'~pad#start with 'o'~okay#Start With 'f'~fight#start with 'k'~kind#start with 'w'~while#start with 'f'~fact#start with 'b'~brass#start with 'n'~next#start with 's'~sin#start with 'd'~drill#start with 'l'~lead#Start With 's'~star#start with 'w'~walk#start with 'q'~quiet#Start With 'b'~but#Start With 'd'~display#start with 'c'~cliff#start with 't'~this#Start With 's'~super#start with 't'~tide#start with 'l'~leg#Start with 'm'~migbuzz#start with 't'~talkinchat#start with 'c'~chatplus#start with 'l'~look#start with 'g'~good#Start With 'c'~copy#start with 'p'~park#start with 'f' ~flee#Start With 'c'~charming#Start With 'n'~nimbuzz#start with 'h'~hat#start with 'e'~enact#Start With 'b'~bear#start with 'b'~band#start with 'e'~east#start with 'b'~ball#start with 'b'~baby#start with 'c'~color#start with 'm'~meat#start with 'h'~horse#start with 't'~too#Start With 'd'~dinner#start with 's'~shell#Start With 's'~sing#start with 'i'~iron#start with 't'~tire#start with 'h'~hand#Start With 'c'~caring#start with 'r'~rank#start with 'h'~honor#start with 'n'~never#start with 'r'~race#Start With 'm'~marvelous#start with 'l'~line#start with 'h'~horse#start with 's'~shine#start with 'd'~down#start with 'l'~lake#start with 'b'~brick#start with 'd'~duty#start with 'w'~weak#start with 'l'~long#start with 'o'~other#start with 'c'~cruel#start with 'p'~purse#start with 's'~strip#start with 'b'~bag#Start With 'i'~intelligent#start with 'b'~bet#start with 'd'~dumb#start with 'd'~dust#Start With 'c'~cheese#Start With 'c'~cow#start with 'f'~fee#Start With 'n'~nimbuzz#start with 'l' ~lose#start with 'j'~joke#start with 'n'~nurse#start with 'p'~park#Start With 'i'~india#start with 'e'~else#start with 'a'~aunt#start with 'l'~lamp#start with 'e'~equal#Start With 'u'~uncle#start with 'b'~band#start with 'f'~five#start with 'm'~medal#Start With 'c'~copper#start with 's'~stop#start with 'b'~badly#start with 'm'~more#start with 'b'~by#start with 's'~silk#start with 'r'~rich#start with 'm'~major#Start With 'g'~gentle#start with 'e'~essay#start with 'b'~beach#start with 't'~type#Start With 'l'~lazer#start with 's'~some#Start With 'e'~extra#start with 't'~that#start with 'a'~again#Start With 'b'~burn#Start With 'a'~apple#Start With 'f'~fantastic#Start With 'e'~exit#start with 'e'~extra#Start With 'l'~lovely#start with 'r'~rally#start with 'p'~pad#start with 'i'~ice#start with 't'~talk#Start With 'b'~ball#start with 's'~sales#start with 'a'~arena#start with 's'~spray#start with 'c'~clip#start with 'p'~play#start with 'n'~now#start with 'a'~all#Start With 'e'~energy#start with 'p'~play#start with 'm'~mrs#start with 'c'~check#start with 'w'~way#start with 'r'~rest#start with 'h'~hole#start with 't'~trust#start with 'm'~most#start with 't'~taxi#start with 'c'~cut#start with 'r'~reply#start with 's'~shoe#start with 's'~stir#Start With 'a'~about#Start With 'c'~caring#start with 'h'~hear#start with 'd'~dull#start with 'w'~wood#start with 'w'~wrap#start with 'i'~ill#start with 'c'~coast#start with 'm'~most#Start With 'e'~east#start with 's'~set#start with 'o'~organ#Start With 'u'~umbrella#start with 'm'~more#start with 'a'~aisle#start with 'm'~mayor#Start With 'e'~elbow#start with 'b'~beast#start with 'o'~only#start with 'w'~was#start with 'g'~goes#start with 'n'~news#start with 'j'~juror#start with 'd'~debt#Start With 'e'~elegant#start with 'j'~just#start with 'b'~brick#Start With 'u'~uncle#start with 'c'~chef#start with 'b'~bell#start with 'u'~uh#start with 'h'~heat#Start With 'g'~gentle#Start With 'd'~darling#start with 'k'~knot#start with 't'~tumor#start with 'j'~joke#start with 'e'~egg#start with 'f'~fold#start with 'y'~year#start with 'c'~color#start with 'c'~coin#start with 'f'~foot#Start With 's'~spelling#Start With 's'~sweet#start with 'b'~bell#start with 's'~sales#start with 'h'~his#start with 'w'~wet#Start With 'e'~east#start with 'g'~grape#Start With 'f'~fire#start with 's'~super#start with 'm'~mind#start with 'd'~deep#start with 'k'~kiss#start with 's' ~short#start with 'h'~half#start with 'j'~juror#start with 'p'~pool#Start With 's'~smart#start with 'w'~wake#start with 'b' ~basic# start with 'p'~pant#start with 'g'~gate#start with 's'~sun#Start With 'e'~eye#start with 'l'~lot#start with 's'~shoe#start with 's'~slip#Start With 'd'~doll#start with 'c'~comb#Start With 's'~serious#Start With 'c'~claw#start with 'p'~party#start with 'b'~bulb#start with 'n'~nod#start with 'a'~all#start with 'b'~blade#start with 'f'~fat#start with 'p'~pizza#Start With 'a'~apple#start with 'c'~cry#start with 's'~silly#start with 'c'~come#Start With 'o'~officer#start with 'q'~quiet#start with 'e'~ego#start with 'c'~code#start with 'l'~lemon#start with 'f'~form#start with 'r'~root#Start With 's'~science#start with 'o'~our#start with 'a'~again#start with 'm'~metal#start with 'd'~dog#start with 'f'~face#start with 't'~tent#Start With 'b'~best#Start With 'c'~caring#Start With 'j'~japan#start with 'e'~eager#start with 'w'~wide#start with 'd'~deny#start with 'f'~five#start with 'f'~for#Start With 'b'~bit#start with 'l'~lose#start with 'r'~rule#Start With 'i'~intelligent#start with 'l'~lip#start with 'b'~band#start with 'd'~dead#start with 'r'~rat#start with 'e'~egg#start with 's'~shine#start with 'm'~made#Start With 'd'~door#start with 'b'~blink#start with 'o'~open#start with 'v'~virus#start with 'e'~east#start with 'l'~lot#start with 'c'~close#Start With 'f'~female#start with 'a'~alien#Start With 'd'~door#start with 'b'~bone#start with 'h'~head#start with 'p'~pole#Start With 'f'~flot#start with 'g'~god#Start With 'e'~end#start with 's'~skill#start with 'n'~nice#start with 'w'~worm#start with 'h'~his#start with 'p'~pale#start with 'f'~fold#start with 'm'~ms#start with 'f'~fact#start with 'h'~heart#start with 's'~stove#start with 'g'~gang#start with 'w'~wine#start with 'l'~look#start with 'w'~was#start with 'm'~made#start with 'f'~form#start with 'a'~arch#start with 'k'~key#start with 'c'~cost#start with 's'~strip#Start With 'p'~phone#start with 'l'~lemon#start with 'd'~drunk#start with 'w'~wound#start with 'u'~usual#start with 's'~storm#start with 's'~son#start with 't'~tea#start with 'r'~rough#Start With 'f'~fire#start with 'a'~apply#Start With 'b'~balance#Start With 'b'~ban#start with 'e'~echo#start with 'h'~hall#start with 't'~toss#start with 'l'~lazy#start with 'h'~happy#Start With 'i'~idea#start with 'a'~alike#start with 'h'~hire#start with 'm'~melt#start with 'l'~look#start with 'd'~drink#start with 'n'~neck#start with 'n'~night#start with 'a'~all#start with 't'~thumb#start with 'f'~foot#Start With 'f'~fifth#Start With 's'~silent#start with 'r'~river#Start With 'm'~mount#start with 'j'~jewel#start with 'h'~home#start with 's'~skin#Start With 'i'~instrument#start with 'c'~cloth#start with 'm'~meat#start with 'n'~no#Start With 'c'~cotton#start with 'a'~awful#start with 'b'~base#start with 'l'~life#start with 'b'~by#start with 'a'~after#Start With 'p'~paper#start with 'w'~wash#start with 'f'~forum#start with 's'~slope#start with 'a'~aim#start with 'l'~lot#start with 'h'~hear#start with 'b'~build#Start With 'k'~kerala#start with 's'~storm#start with 'r'~reply#start with 'd'~deep#start with 'm'~myth#start with 'a'~air#start with 'd'~dull#Start With 'e'~eyebrow#start with 'b'~bag#start with 'p'~palm#start with 'l'~lack#start with 't'~top#Start With 'e'~emotion#Start With 'b'~ball#start with 'w'~wagon#start with 'k'~knot#start with 's'~space#start with 'f'~foot#Start With 'g'~girl#Start With 'a'~amazingly#start with 'o'~okay#start with 'r'~rib#Start With 's'~sing#start with 'c'~cave#Start With 'c'~country#Start With 'i'~instrument#start with 'w'~wow#start with 'f'~free#Start With 'f'~frod#start with 'f'~flesh#start with 'p'~pin#Start With 'k'~kerala#Start With 'm'~mobile#start with 'l'~liver#start with 'w'~with#start with 'm'~meat#start with 'w'~wing#start with 'l'~lens#start with 'e'~elect#start with 's'~son#start with 'm'~meow#start with 'f'~five#start with 'b'~bad#start with 'm'~more#start with 'g'~got#start with 'w'~wage#start with 'h'~hole#start with 'b'~blue#Start With 'w'~wonderful#start with 'p'~poor#Start With 'e'~elbow#start with 'w'~wing#Start With 'a'~adorable#start with 'o'~over#start with 'h'~hell#start with 's'~set#start with 'p'~pat#Start With 'c'~camp#start with 'l'~level#start with 'm'~miss#start with 't'~till#start with 'b'~basis#start with 's'~some#start with 'f'~fix# start with 'f'~free#Start With 'b'~behave#start with 's'~seat#start with 's'~stake#start with 'b'~ball#start with 'f'~fall#start with 't'~tea#start with 's'~shed#start with 'p'~park#start with 'j'~jump#start with 's'~some#start with 'a'~awake#start with 'w'~wrong#start with 'c'~clock#start with 's'~such#start with 'f'~free#Start With 'f'~frod#start with 'w'~world#start with 'u'~until#start with 's'~send#start with 'a'~ago#start with 'p'~piece#Start With 'f'~faimous#start with 's'~set#start with 'o'~over#start with 't'~tail#start with 'l'~load#Start With 'w'~wonderful#start with 'l'~leg#Start With 'e'~end#start with 'f'~flee#start with 's'~sexy#start with 'f'~fifth#start with 'f'~flame#start with 'r'~rest#start with 'u'~up#Start With 'f'~fish#start with 'o'~orbit#Start With 'e'~education#Start With 'r'~responsible#start with 'm'~may#start with 'l'~label#start with 'm'~ms#start with 'b'~brave#start with 'k'~knot#Start With 'i'~intelligent#start with 'l'~lot#start with 'n'~nod#start with 'o'~okay#Start With 's'~superman#start with 't'~total#start with 'w'~wage#start with 'e'~easy#start with 'l'~like#start with 'c'~cool#start with 's'~seize#Start With 's'~singer#start with 'p'~pet#start with 'c'~candy#start with 'o'~oak#start with 'd'~dutch#start with 'b'~beer#start with 'c'~city#start with 'd~dog#start with 'a'~as#start with 'a'~awake#start with 'n'~night#start with 'r'~root#start with 'o'~off#Start With 'a'~aunty#Start With 'c'~chan#start with 'w'~work#Start With 'l'~love#start with 'h'~her#start with 'd'~delay#start with 'c'~call#start with 'o'~ore#start with 'p'~paint#Start With 'b'~better#start with 'c'~check#Start With 'c'~camp#start with 'm'~moon#start with 'f'~flee#start with 'c'~chase#Start With 'b'~behave#start with 'd'~drunk#start with 'p'~phone#start with 'r'~rub#Start With 'b'~by#start with 'w'~wheat#start with 'm'~marry#start with 'm'~music#start with 'm'~miss#Start With 'f'~fellow#start with 'c'~chin#Start With 't'~tamil#start with 'n'~nose#start with 'c'~cut#start with 'l'~loop#Start With 'm'~malayalam#Start With 's'~smart#start with 'l'~lay#Start With 'i'~india#Start With 'm'~marvelous#start with 't'~toe#start with 'l'~lot#start with 'g'~grief#start with 'h~hair#start with 'b'~brand#start with 'd'~diary#Start With 'p'~pakistan#start with 'e'~elect#start with 'l'~label#start with 's'~sure#start with 'h'~head#Start With 'd'~door# start with 's'~silly#start with 'h'~head#start with 'u'~unit#start with 'l'~limit#Start With 's'~story#Start With 'f'~fat#start with 'c'~cruel#Start With 'e'~eyebrow#Start With 't'~turn#start with 'o'~orbit#start with 'h'~hold#start with 's'~slope#start with 't'~tile#Start With 'm'~mount#Start With 'b'~but#start with 'p'~put#Start With 'b'~brb#start with 'd'~dutch#start with 'p'~pizza#start with 'd'~dike#start with 's'~sake#start with 'm'~meat#start with 'p'~press#start with 't'~try#Start With 'i'~india#start with 'l'~lazy#start with 'o'~ok#start with 'a'~apple#start with 'c'~copy#start with 'e'~enact#Start With 'b'~bowl#Start With 's'~system#start with 'f'~from#start with 'g'~gate#start with 'k'~king#start with 'p'~page#start with 'h'~hand#start with 'h'~heart#start with 'm'~more#start with 'p'~play#start with 'p'~piano#start with 'i'~iron#start with 's'~shell#start with 'b'~band#start with 'c'~chain#start with 'f'~fox#start with 'h'~hand#start with 'b'~book#start with 'd'~dike#start with 'f'~for#start with 'b'~bed#start with 'a'~agent#start with 'u'~ugly#Start With 's'~sing#start with 'h'~hard#start with 'r'~react#Start With 'f'~frod#start with 't'~tell#start with 'e'~echo#start with 'b'~bay#start with 'd'~desk#start with 'b'~blow#Start With 'n'~nice#Start With 'n'~nimbuzz#start with 'r'~route#start with 'b'~bone#start with 's'~sex#start with 'c'~coil#Start With 'b'~burn#start with 'l'~later#start with 'h'~honor#Start With 'c'~chatroom#start with 'n'~name#start with 'r'~rack#Start With 'a'~aunty#Start With 'e'~energy#Start With 'u'~umbrella#start with 'f'~final#start with 'l'~life#Start With 'f'~fork#Start With 'e'~exist#start with 'b'~best#start with 'p'~poi#start with 'a'~awake#start with 's'~slip#start with 's'~sorry#Start With 'i'~instrument#Start With 's'~song#start with 'z'~zoo#start with 'm'~meat#start with 'r'~rape#start with 'l'~look#start with 'b'~base#start with 'l'~less#start with 't'~toe#start with 'w'~word#start with 's'~shirt#Start With 'f'~film#Start With 'b'~bed#start with 'f'~forum#start with 'w'~wage#start with 'w'~west#start with 's'~same#Start With 'd'~dinner#start with 'i'~its#start with 'o'~onto#start with 'e'~end#Start With 'f'~fry#start with 'e'~egg#start with 'f'~fly#Start With 'd'~dear#start with 'l'~less#Start With 'c'~copy#start with 'p'~play#start with 'n'~none#start with 'b'~bomb#start with 'a'~arch#start with 'r'~rub#start with 'm'~more#start with 'o'~onion#start with 't'~two#Start With 'l'~letter#start with 'b'~box#Start With 'l'~lazer#start with 'f'~free#start with 'm'~mix#Start With 'c'~call#start with 'm'~meow#start with 'b'~brave#start with 'w'~well#Start With 'c'~cell#Start With 's'~song#start with 'a'~aunt#start with 'w'~wash#start with 's'~shine#start with 'm'~much#start with 'g'~get#start with 's'~shall#Start With 'n'~nepal#start with 's'~spark#start with 'h'~honey#start with 'w'~wish#Start With 'd'~door#Start With 'w'~weather#start with 'a'~again#start with 'p'~play#start with 'b'~buddy#start with 's'~swear#Start With 'l'~owl#start with 's'~sake#start with 'd'~dad#Start With 'v'~view#start with 's'~she#start with 'p'~pin#start with 'w'~wagon#start with 'w'~wax#start with 'n'~night#Start With 'f'~frod#start with 'e'~etc#start with 't'~tube#start with 't'~tail#start with 'w'~wax#start with 't'~tie#start with 'b'~band#start with 'u'~uh#start with 'r'~rod#Start With 'g'~go#start with 'n'~name#Start With 'w'~wonderful#start with 'u'~union#start with 'p'~plus#start with 't'~truly#Start With 'g'~go#Start With 'f'~fun#start with 'o'~odd#Start With 'c'~camb#start with 's'~shore#start with 't'~try#start with 'l'~lid#start with 'm'~mark#Start With 'd'~darkness#start with 'j'~jewel#start with 's'~shut#start with 'c'~chair#start with 'm'~many#Start With 'h'~high#Start With 'm'~minister#Start With 'b'~bing#start with 'o'~ought#start with 'f'~feel#start with 'a'~ad#start with 'f'~free#Start With 'f'~fast#start with 'a'~as#start with 'd'~dear#start with 'b'~band#start with 'a'~alarm#start with 'l'~link#start with 'b'~bean#start with 'a'~agree#Start With 'c'~complex#Start With 'b'~bat#start with 's'~slice#start with 'm'~mass#start with 'h'~hold#Start With 'f'~fast#start with 'p'~pray#start with 's'~sky#Start With 'm'~mobile#start with 'e'~east#start with 's'~stir#start with 'p'~party#start with 't'~tile#start with 'm'~meal#start with 's'~slope#start with 'e'~essay#Start With 'w'~wing#start with 'l'~level#start with 'n'~never#Start With 'c'~cell#start with 'k'~knife#Start With 'e'~energy#Start With 'c'~crown#start with 'c'~city#start with 'w'~while#start with 's'~song#start with 'w'~wine#start with 'b'~badly#start with 'c'~cool#start with 'f'~fat#start with 's'~scan#start with 't'~tall#start with 'b'~bone#Start With 'b'~blame#start with 'l'~lack#start with 'h'~huh#start with 'e'~every#Start With 'f'~fried#start with 't'~toy#start with 'r'~rush#start with 'j'~juice#start with 'w'~who#Start With 'a'~america#start with 'w'~work#start with 'r'~rush#start with 'd'~doll#Start With 'n'~north#start with 'g'~guess#start with 'm'~movie#start with 't'~test#start with 's'~shirt#start with 'n'~nose#start with 's'~silk#Start With 'd'~dinner#Start With 'f'~friendly#start with 'm'~more#start with 'm'~mass#start with 'c'~cake#start with 'g'~goat#start with 't'~throw#start with 'h'~hair#start with 'b'~butt#start with 's'~shed#start with 'd'~data#Start With 'f'~facebook#start with 'b'~best#start with 'a'~alarm#start with 'a'~any#Start With 'g'~go# start with 'f'~forth#start with 'w'~would#Start With 'y'~youth#start with 'f'~fast#start with 'o'~our#start with 'w'~wet#Start With 'd'~driving#start with 'd'~dead#start with 'p'~proof#start with 'a'~album#Start With 'g'~gangster#start with 'l'~lady#start with 'p'~pick#start with 'p'~pan#start with 'c'~chef#Start With 'e'~enter#start with 'm'~mass#Start With 'i'~instrument#start with 'l'~lay#start with 'w'~wish#start with 'h'~half#start with 'm'~mrs#start with 's'~stand#start with 'h'~huh#start with 's'~stuff#start with 'o'~once#start with 'p'~plan#start with 'h'~hour#start with 'b'~bind#start with 'c'~cliff#Start With 'f'~facebook#start with 's'~sheet#Start With 'd'~driver#Start With 'l'~leave#start with 's'~shut#start with 'm'~mine#start with 'l'~lose#start with 'p'~palm#start with 'o'~only#start with 'l'~lake#start with 'd'~dna#Start With 'c'~chatroom#Start With 'l'~leave#Start With 'p'~power#start with 'p'~pitch#Start With 'f'~fat#start with 'w'~wide#start with 'p'~pond#start with 'f'~feel#start with 't'~trade#start with 'j'~jump#start with 't'~tax#Start With 's'~singer#start with 'f'~fat#Start With 'd'~daughter#Start With 'c'~confusing#start with 'd'~door#start with 'm'~mark#start with 'a'~am#start with 'm'~main#start with 'd'~daily#start with 'm'~mere#start with 'f'~feel#start with 'w'~wear#start with 's'~size#start with 'c'~cover#start with 'a'~adopt#start with 's'~stuff#start with 'b'~boast#start with 't'~thin#Start With 'b'~beer#start with 'f' ~fold#start with 'c'~cloth#start with 'm'~myth#Start With 'c'~camera#start with 'b'~bird#start with 'b'~bad#Start With 'j'~jump#start with 'c'~climb#Start With 'g'~gentleman#start with 'c'~comb#start with 'a'~agent#start with 's'~stem#Start With 's'~system#start with 'b'~boy#start with 'p'~pant#Start With 'o'~owner#start with 'b'~bat#start with 'l'~less#start with 'i'~inch# start with 'c'~call#Start With 'a'~aunty#start with 'd'~dam#Start With 'g'~gangster#Start With 'r'~river#start with 's'~send#Start With 'f'~female#Start With 'd'~dash#Start With 'v'~view#start with 'p'~point#Start With 'c'~chain#start with 'n'~no#start with 'w'~will#start with 'l'~line#start with 's'~skin#Start With 'h'~heart#start with 'l'~like#start with 'h'~huge#start with 'j'~join#Start With 'f'~fish#start with 'p'~pin#start with 'n'~note#Start With 'f'~faithful#Start With 'e'~end#start with 'w'~weak#Start With 'd'~dinner#Start With 'f'~following#start with 'b'~buy#start with 't'~trash#start with 'j'~joke#start with 't'~toss#Start With 'i'~idea#start with 'l'~lady#start with 'n'~nice#start with 'a'~arm#start with 'f'~fall#start with 'f'~form#start with 'm'~mood#Start With 'a'~aamir#Start With 'a'~away#start with 'd'~depth#start with 'o'~ocean#Start With 'c'~cat#start with 's'~seat#start with 'd'~duty#start with 'c'~comb#Start With 'f'~following#start with 's'~swear#start with 'b'~basis#start with 'p'~pitch#start with 'c'~corn#start with 'r'~round#start with 'f'~from#start with 'i'~ideal#Start With 'b'~burn#Start With 'f'~frog#Start With 'c'~cheese#start with 'c'~cycle#start with 'f'~feel#Start With 'e'~energy#start with 'h'~hell#Start With 'n'~natural#start with 'm'~mix#start with 'l'~less#start with 'm'~main#Start With 'd'~darling#start with 'b'~bride#Start With 'd'~drew#Start With 'c'~chan#start with 'b'~basis#start with 'c'~claim#Start With 'j'~jaan#start with 'f'~far#Start With 's'~silent#Start With 's'~seductive#Start With 'c'~chater#start with 'e'~easy#Start With 'c'~caring#Start With 'l'~love#Start With 'w'~window#start with 'p'~pig#start with 'z'~zero#Start With 'a'~ali#start with 'c'~cloth#start with 'e'~extra#start with 'p'~path#start with 'c'~code#start with 'f'~flee#start with 'e'~elect#Start With 'r'~river#start with 't'~tired#start with 'n'~note#start with 'y'~yes#start with 'g'~gun#start with 'a'~alien#start with 'd'~dull#start with 't'~tell#start with 'a'~age#start with 'p'~path#start with 'c'~color#Start With 'b'~bear#start with 'p'~pig#Start With 's'~spelling#start with 'l'~load#start with 'l'~land#start with 's'~scale#start with 'r'~riot#start with 'm'~ms#start with 's'~shoe#start with 'a'~and#start with 'u'~upset#start with 'w'~when#start with 'r'~ratio#start with 'p'~pond#start with 'c'~can#start with 'l'~let#start with 'y'~yeah#Start With 'u'~unique#start with 's'~steep#start with 'w'~wood#start with 'd'~doll#start with 't'~taste#Start With 'f'~flop#start with 'l'~lean#start with 'c'~cost#start with 'c'~clip#start with 'b'~big#Start With 'c'~cash#Start With 't'~ticket#Start With 'c'~clock#start with 'd'~drill#start with 's'~stem#Start With 'd'~dinner#start with 'f'~from#start with 'w'~wife#start with 'l'~leg#start with 'a'~again#start with 'b'~box#Start With 'd'~display#Start With 'c'~copy#start with 'c'~coast#start with 'b'~buyer#Start With 'd'~display#Start With 'i'~instrument#Start With 'k'~kerala#start with 'l'~lamp#start with 'd'~day#start with 't'~type#start with 'k'~knot#start with 'm'~myth#start with 'a~add#start with 'c'~cling#Start With 'a'~america#start with 'r'~risk#start with 'm'~meat#start with 'e'~ear#start with 'n'~net#Start With 'o'~one#start with 'l'~load#start with 's'~stuff#start with 'u'~under#start with 's'~slice#start with 'b'~base#Start With 'n'~naughty#start with 's'~sick#start with 'm'~more#start with 'l'~loud#start with 'm'~mix#start with 'd'~diary#start with 't'~tour#start with 't'~track#Start With 'g'~gentle#start with 'c'~cruel#Start With 'b'~but#Start With 'c'~crack#start with 's'~soon#start with 'y'~yes#Start With 'c'~cort#start with 't'~tire#start with 's'~scan#Start With 'c'~car#start with 's'~soft#start with 'a'~ash#start with 'j'~juice#start with 's'~same#start with 'r'~riot#start with 'f'~file#start with 'c'~clip#start with 't'~tile#start with 'p'~piano#start with 'r'~rise#start with 'r'~rough#start with 'l'~lamp#start with 'c'~clip#start with 'h'~hand#start with 'w'~way#start with 'e'~else#start with 'b'~boat#Start With 's'~system#Start With 'f'~fifth#start with 'd'~desk#start with 'h'~honor#start with 'h'~hear#start with 's'~shock#start with 's'~same#start with 'c'~cat#start with 'g'~gift#start with 'u'~us#start with 'w'~wage#start with 'm'~mind#start with 'f'~fish#Start With 'f'~frog#Start With 'f'~fever#start with 'a'~all#start with 'u'~under#Start With 'd'~driver#Start With 'f'~fried#start with 'f'~fruit#start with 't'~tent#Start With 'b'~bet#start with 'j'~jewel#start with 'l'~lame#start with 'h'~hire#Start With 'b'~barber#start with 's'~sixth#Start With 's'~scooter#start with 's'~stop#Start With 'e'~edit#start with 'h'~half#start with 'm'~mix#start with 'f'~fair#start with 's'~sigh#start with 'l'~lean#start with 'h'~hole#start with 'p'~phase#Start With 'd'~drum#Start With 't'~transport#Start With 'd'~driving#start with 'm'~mix#start with 'p'~pork#start with 'a'~acid#start with 'm'~music#start with 'd'~dress#start with 'g'~go#Start With 'j'~jaan#start with 'k'~kit#Start With 'd'~display#Start With 'b'~behind#start with 'd'~dozen#Start With 'f'~flame#start with 'f'~from#Start With 'p'~phone#start with 'c'~chase#start with 'h'~help#start with 'c'~comb#start with 'y'~year#start with 'c'~cling#start with 'b'~bed#start with 's'~soft#start with 'c'~come#start with 'b'~bat#start with 'e'~enact#start with 'y'~yet#start with 't'~tire#start with 'h'~honor#Start With 'l'~lovely#Start With 'd'~dam#start with 'w'~wet#Start With 's'~serious#start with 't'~tile#start with 'h'~hunt#start with 'b'~bowl#start with 'h'~heel#start with 'h'~help#start with 'o'~one#start with 'o'~open#start with 'a'~admit#Start With 'b'~bill#start with 'i'~idea#Start With 'i'~idea#Start With 'f'~friend#start with 's'~steel#start with 'd'~dna#Start With 'a'~attractive#start with 'w'~wash#Start With 'b'~barber#start with 'r'~reply#start with 'c'~clock#start with 'c'~cook#start with 'p'~pc#start with 'h'~hunt#Start With 'p'~potato#start with 'e'~ear#Start With 'f'~flot#Start With 't'~three#start with 'h'~home#start with 's'~soft#start with 'c'~cover#Start With 'r'~rocket#start with 'b'~boat#Start With 'p'~port#start with 'h'~horse#Start With 'a'~attractive#start with 's'~some#start with 'f'~free#start with 'd'~drive#start with 't'~thin#Start With 'a'~attitude#start with 's'~send#start with 'b'~beat#start with 'b'~brief#start with 'w'~will#start with 'w'~wing#start with 'b'~buddy#start with 'm'~major#start with 'm'~mix#Start With 'e'~emotion#Start With 'd'~driver#start with 'p'~put#start with 'w'~wish#start with 'p'~print#Start With 'b'~better#start with 'e'~exit#start with 'h'~hold#start with 'j'~jug#start with 'c'~city#start with 'g'~grief#start with 'l'~lead#start with 'b'~brief#start with 's'~spark#Start With 'b'~bat#start with 'a'~and#start with 'h'~hear#start with 'w'~went#start with 'd'~dike#Start With 'q'~quiz#start with 'h'~help#start with 'b'~bag#start with 'w'~wear#start with 'a'~alarm#Start With 's'~scooter#Start With 'e'~elegant#start with 't'~try#Start With 'i'~intelligent#Start With 'm'~married#start with 'c'~city#start with 'p'~pump#start with 'm'~menu#start with 't'~teen#start with 'l'~less#start with 'y'~yes#start with 't'~thumb#Start With 'e'~entry#start with 'b'~beef#Start With 'p'~potato#start with 'q'~quiet#start with 'c'~cliff#Start With 'd'~dam#start with 'k'~knot#start with 'm'~mine#start with 'p'~phase#start with 'b'~brief#start with 'b'~boast#start with 'k'~knot#start with 'n'~nurse#start with 'b'~brake#start with 't'~tall#start with 'e'~each#start with 'p'~pork#Start With 'a' ~ali#start with 'l'~lump#start with 'd'~data#start with 's'~she#start with 'r'~rain#start with 'p'~print#start with 'b'~bone#start with 'p'~pump#start with 'o'~occur#Start With 'c'~cot# start with 'a'~as#start with 'b'~beat#Start With 'a'~amazingly#Start With 'c'~complex#Start With 'b'~bite#start with 'b'~block#start with 't'~tool#start with 's'~soap#start with 'l'~long#Start With 'g'~go#Start With 'd'~drag#Start With 'm'~married#start with 'e'~ego#start with 'b'~brave#Start With 'e'~elbow#start with 's'~strip#start with 'a'~album#start with 'p'~print#Start With 'c'~china#start with 'm'~mask#start with 'c'~cafe#start with 'c'~chew#start with 't'~test#start with 'f'~fold#start with 'r'~rod#start with 'f'~for#start with 'e'~elite#start with 'q'~queen#start with 'c'~case#Start With 'e'~exit#start with 'c'~cost#start with 'h'~honor#Start With 'r'~regret#start with 'p'~pool#start with 'l'~leg#start with 'b'~bird# start with 'o'~ocean#start with 's'~swim#start with 's'~space#start with 'o'~ocean#start with 'a'~and#start with 'l'~liver#start with 'o'~ore#start with 'm'~mine#start with 'w'~wing#Start With 'f'~family#start with 'd'~dive#start with 'w'~weird#Start With 'c'~camera#Start With 'e'~earn#start with 'h'~hole#start with 'p'~prize#start with 'r'~riot#start with 'u'~use#start with 'f'~few#start with 'i'~is#start with 'o'~one#start with 'b'~brick#start with 'b'~blade#start with 'r'~river#start with 'h'~head#Start With 'n'~nepal#Start With 'm'~mount#start with 's'~skirt#start with 'p'~page#Start With 'b'~blast#start with 'a'~aside#start with 'h'~heel#start with 'g'~girl#start with 't'~twin#start with 'c'~card#start with 'g'~girl#start with 's'~sell#Start With 'k'~knife#start with 'b'~blond#start with 'w'~well#start with 'o'~on#Start With 'b'~bing#start with 'h'~hot#Start With 'b'~bite#Start With 'a'~ali#start with 'p'~pitch#start with 'p'~prove#start with 'm'~main#start with 'p'~pink#start with 'w'~when#start with 'm'~mask#start with 'd'~dumb#Start With 'c'~chater#start with 'c'~card#Start With 'k'~knife#start with 'b'~boast#start with 's'~shock#Start With 'b'~ball#start with 's'~step#start with 'n'~never#start with 't'~tool#start with 'c'~cover#start with 'p'~pick#start with 'b'~bird#start with 't'~town#start with 'y'~yes#start with 'a'~alone#start with 'l'~lower#start with 's'~slice#start with 'd'~drop#start with 's'~spark#start with 'f'~flesh#Start With 'd'~danger#start with 'f'~flee#Start With 'b'~but#start with 'f'~free#start with 'u'~usual#start with 'f'~fool#Start With 'c'~change#start with 'b'~beast#start with 's'~some#start with 'd'~drop#start with 's'~super#start with 'o'~orbit#start with 'c'~chief#start with 's'~stop#start with 'f'~flame#start with 'd'~drink#start with 'l'~lid#Start With 'f'~four#start with 'l'~lose#Start With 'a'~apply#start with 'm'~metal#start with 'u'~unit#Start With 'f'~flop#start with 'm'~menu#start with 'a'~album#Start With 'f'~fast#start with 'a'~age#start with 'o'~odd#start with 'r'~rally#start with 'p'~play#start with 'o'~organ#start with 'l'~line#start with 's'~spade#start with 'c'~crack#start with 'c'~corn#start with 'a'~aunt#start with 'm'~mark#start with 'e'~easy#start with 'b'~blind#start with 'l'~lady#start with 'g'~got#start with 'b'~buy#Start With 'r'~royal#start with 'h'~huh#start with 's'~shut#Start With 's'~story#Start With 'c'~clock#start with 'j'~job#Start With 'c'~confusing#Start With 'v'~viewer#start With 'd'~drag#Start With 'r'~red#Start With 's'~superman#start with 'd'~door#start with 's'~steep#Start With 'q'~quarter#Start With 'f'~following#start with 'c'~come#start with 's'~score#Start With 'd'~driver#start with 'd'~dead#Start With 'f'~five#start with 'b'~bow#start with 't'~taste#start with 'n'~never#start with 'u'~under#Start With 'f'~frog#Start With 'c'~cracker#start with 'e'~eat#start with 's'~sell#start with 'm'~miss#Start With 'd'~dot#start with 'd'~dna#start with 'm'~medal#start with 'w'~who# start with 'q'~quiet#start with 'c'~chalk#start with 'u'~ugly#Start With 'y'~yellow#Start With 'f'~fellow#start with 'y'~yes# start with 'a'~adopt#start with 'g'~got#start with 'e'~essay#start with 'd'~drop#start with 'g'~good#start with 's'~sit#start with 'd'~do#start with 'd'~diary#Start With 's'~super#Start With 'e'~energy#start with 'h'~hole#start with 'a'~above#Start With 'd'~driving#Start With 's'~seductive#start with 'a'~arena#Start With 'a'~away#Start With 'b'~best#start with 'p'~pump#start with 'f'~from#start with 'r'~route#start with 'b'~bay#Start With 'd'~darkness#start with 'w'~wild#start with 'f'~fresh#start with 'n'~name#start with 'j'~juice#start with 'b'~back#start with 'w'~west#Start With 'l'~lime#start with 'b'~beat#start with 'p'~play#start with 'n'~none#Start With 'b'~butter#Start With 'd'~darling#start with 'b'~basis#start with 'd'~drug#start with 't'~thumb#start with 's'~sigh#start with 'h'~heel#start with 's'~son#start with 'b'~bow#start with 'l'~lame#start with 'f'~for#start with 'n'~nut#start with 'p'~park#start with 'c'~cost#start with 'p'~phase#Start With 'c'~cash#start with 'f'~feel#start with 'w'~wheat#start with 'l'~later#start with 's'~shoe#start with 'h'~hour#start with 't'~toxic#start with 'b'~bed#start with 's'~such#start with 'b'~brief#Start With 'f'~family#start with 'p'~plan#start with 'h'~hot#start with 'u'~use#start with 's'~skirt#Start With 'g'~gentle#Start With 'b'~bill#Start With 'p'~pakistan#start with 'a'~area#start with 'b'~beast#start with 'q'~quiet#start with 'd'~diet#Start With 'e'~ear#start with 'b'~bow#Start With 'p'~phone#start with 'l'~life#start with 'b'~basic#start with 'l'~loose#start with 'g'~gay#start with 'g'~god#start with 'c'~cling#start with 'r'~rape#Start With 'w'~win#Start With 'b'~ban#start with 'd'~daily#Start With 'b'~bing#start with 'c'~crack#start with 'w'~wrap#start with 'p'~pick#start with 's'~slope#start with 'w'~wound#Start With 's'~style#start with 'b'~bare#start with 'g'~get#Start With 's'~style#start with 't'~troop#start with 'h'~her#Start With 'f'~friendly#start with 'd'~deny#start with 'l'~lamp#start with 'o'~organ#start with 'n'~note#start with 'a'~adopt#start with 'w'~way#start with 'd'~drop#Start With 'n'~necessary#start with 'j'~juror#start with 'a'~am#start with 's'~sink#start with 'p'~pant#start with 'd'~dad#start with 'l'~lazy#start with 'p'~part#start with 'a'~agree#start with 'c'~code#Start With 'j'~japan#start with 'e'~envy#Start With 'f'~friend#start with 'b'~blow#start with 'a'~alarm#start with 'a'~awake#start with 'a'~album#start with 'a'~acid#start with 'a'~add#start with 'a'~arena#start with 'a'~after#start with 'a'~ash# start with 'a'~apple#start with 'a'~all#start with 'a'~am#start with 'a'~admit#start with 'a'~aim#start with 'a'~anger#start with 'a'~aunt#start with 'a'~arch#start with 'a'~area#start with 'a'~as#start with 'a'~ash#start with 'a'~agent#start with 'a'~auto#start with 'a'~await#start with 'a'~any#start with 'a'~ad#start with 'a'~and#start with 'a'~adopt#start with 'a'~awful#start with 'a'~again#start with 'a'~age#start with 'a'~agree#start with 'a'~alien#start with 'a'~air#start with 'a'~aside#start with 'a'~ask# start with 'a'~all#start with 'a'~aisle#start with 'a'~alike# start with 'a'~am#start with 'a'~and#start with 'a'~along#start with 'a'~above#start with 'a'~alone#start with 'a'~ago#start with 'a'~apple# start with 'a'~apply#start with 'a'~apart#start with 'a'~alter#start with 'a'~arm#start with 'a~actor#start with 'a'~as#start with 'a'~aunt#start with 'a'~aware#start with 'a'~allow#start with 'b'~bear#start with 'b'~beat#start with 'b'~badly#start with 'b'~bar#start with 'b'~brave#start with 'b'~bat#start with 'b'~bad#start with 'b'~band#start with 'b'~beach#start with 'b'~ball#start with 'b'~brake#start with 'b'~bay# start with 'b'~bare#start with 'b'~back#start with 'b'~body#start with 'b'~bake#start with 'b'~bed#start with 'b'~beef#start with 'b'~beer#start with 'b'~bag#start with 'b'~bind#start with 'b'~bike#start with 'b'~blade#start with 'b'~born#start with 'b'~blond#start with 'b'~bone#start with 'b'~bow#start with 'b'~boy#start with 'b'~bring#start with 'b'~brass#start with 'b'~butt#start with 'b'~bulb#start with 'b'~buddy#start with 'b'~baby#start with 'b'~brick#start with 'b'~band#start with 'b'~brand#start with 'b'~bird#start with 'b'~bean#start with 'b'~beat#start with 'b'~bed#start with 'b'~bent#start with 'b'~buyer#start with 'b'~bang#start with 'b'~bag#start with 'b'~both#start with 'b'~big#start with 'b'~blind#start with 'b'~bride#start with 'b'~basis#start with 'b'~build#start with 'b'~block#start with 'b'~book#start with 'b'~ball#start with 'b'~belt#start with 'b'~bell#start with 'b'~belly#start with 'b'~blink#start with 'b'~blow#start with 'b'~blank#start with 'b'~bend#start with 'b'~boil#start with 'b'~bomb#start with 'b'~both#start with 'b'~bowl#start with 'b'~boss#start with 'b'~brief#start with 'b'~bird#start with 'b'~base#start with 'b'~basic#start with 'b'~best#start with 'b'~boast#start with 'b'~boat#start with 'b'~bet#start with 'b'~beast#start with 'b'~blue#start with 'b'~but#start with 'b'~burn# start with 'b'~box#start with 'b'~by#start with 'b'~buy#start with 'c'~cab#start with 'c'~chain#start with 'c'~can#start with 'c'~crack#start with 'c'~case#start with 'c'~cheap#start with 'c'~cat#start with 'c'~comb#start with 'c'~card#start with 'c'~cap#start with 'c'~code#start with 'c'~care# start with 'c'~cycle#start with 'c'~chef#start with 'c'~cafe#start with 'c'~chair#start with 'c'~chest#start with 'c'~click#start with 'c'~clock#start with 'c'~candy#start with 'c'~coat#start with 'c'~coil#start with 'c'~comb#start with 'c'~cook#start with 'c'~cool#start with 'c'~color#start with 'c'~cross#start with 'c'~cry#start with 'c'~cost#start with 'c'~cut#start with 'c'~cover#start with 'c'~copy#start with 'c'~cave#start with 'c'~check#start with 'c'~chase#start with 'c'~come#start with 'c'~chalk#start with 'c'~chop#start with 'c'~couch# start with 'c'~cloth#start with 'c'~cliff#start with 'c'~cling#start with 'c'~chief#start with 'c'~coin#start with 'c'~cake#start with 'c'~call#start with 'c'~clip#start with 'c'~climb#start with 'c'~claim#start with 'c'~chin#start with 'c'~corn#start with 'c'~crowd#start with 'c'~cool#start with 'c'~code#start with 'c'~cork#start with 'c'~close#start with 'c'~coast#start with 'c'~card#start with 'c'~cry#start with 'c'~case#start with 'c'~cost#start with 'c'~city#start with 'c'~cruel#start with 'c'~cough#start with 'c'~cup#start with 'c'~cut#start with 'c'~chew#start with 'c'~claw#start with 'd'~dna#start with 'd'~data#start with 'd'~day#start with 'd'~dead#start with 'd'~dumb#start with 'd'~dad#start with 'd'~dead#start with 'd'~depth#start with 'd'~dress# start with 'd'~deny#start with 'd'~dog#start with 'd'~drug#start with 'd'~dish#start with 'd'~delay#start with 'd'~dam#start with 'd'~drink#start with 'd'~dear#start with 'd'~deer#start with 'd'~dull#start with 'd'~dead#start with 'd'~debt#start with 'd'~deep#start with 'd'~deep#start with 'd'~dutch#start with 'd'~diary#start with 'd'~drive#start with 'd'~dive#start with 'd'~dike#start with 'd'~drunk#start with 'd'~desk#start with 'd'~daily#start with 'd'~drill#start with 'd'~do#start with 'd'~dog#start with 'd'~door#start with 'd'~doll#start with 'd'~drop#start with 'd'~draw#start with 'd'~drop#start with 'd'~diet#start with 'd'~dust#start with 'd'~down#start with 'd'~duty#start with 'd'~dozen#start with 'e'~each#start with 'e'~enact#start with 'e'~east#start with 'e'~equal# start with 'e'~east# start with 'e'~extra#start with 'e'~ear#start with 'e'~etc#start with 'e'~eager#start with 'e'~egg#start with 'e'~ego# start with 'e'~elect#start with 'e'~earn#start with 'e'~end#start with 'e'~entry# start with 'e'~ever#start with 'e'~egg# start with 'e'~evil#start with 'e'~enjoy# start with 'e'~else#start with 'e'~echo#start with 'e'~every#start with 'e'~essay#start with 'e'~eat#start with 'e'~elite#start with 'e'~exit#start with 'e'~empty#start with 'e'~easy#start with 'e'~enemy#start with 'e'~envy#start with 'f'~frame#start with 'f'~fact#start with 'f'~fall#start with 'f'~fame#start with 'f~fast#start with 'f'~fat#start with 'f'~fold#start with 'f'~fold#start with 'f'~free#start with 'f'~face#start with 'f'~feel#start with 'f'~file#start with 'f'~flesh#start with 'f'~fair#start with 'f'~fan#start with 'f'~farm#start with 'f'~fee#start with 'f'~feel#start with 'f'~free#start with 'f'~free#start with 'f'~few#start with 'f'~fall#start with 'f'~from#start with 'f'~form#start with 'f'~fool#start with 'f'~for#start with 'f'~fork#start with 'f'~fox#start with 'f'~far#start with 'f'~fresh#start with 'f'~forth#start with 'f'~fruit#start with 'f'~fat#start with 'f'~fish#start with 'f'~fifth#start with 'f'~fix#start with 'f'~flee#start with 'f'~flag#start with 'f'~flow#start with 'f'~fly#start with 'f'~fool#start with 'f~flame#start with 'f'~final# start with 'f'~food#start with 'f'~fold#start with 'f'~for#start with 'f'~forum#start with 'f'~form#start with 'f'~flat#start with 'f'~foot#start with 'f'~foot#start with 'f'~five#start with 'g'~god#start with 'g'~gate#start with 'g'~get#start with 'g'~guess#start with 'g'~grave#start with 'g'~gas#start with 'g'~game#start with 'g'~get#start with 'g'~girl#start with 'g'~goat#start with 'g'~grape#start with 'g'~grasp#start with 'g'~gas#start with 'g'~gift#start with 'g'~ghost#start with 'g'~gang#start with 'g'~go# start with 'g'~gold#start with 'g'~good#start with 'g'~goes#start with 'g'~got#start with 'g'~grief#start with 'g'~gate#start with 'g'~gun#start with 'g'~gun#start with 'g'~gay#start with 'h'~ha#start with 'h'~head#start with 'h'~hair#start with 'h'~hand#start with 'h'~hat#start with 'h'~hand#start with 'h'~head# start with 'h'~hide#start with 'h'~hold#start with 'h'~hold#start with 'h'~heel#start with 'h'~hole# start with 'h'~have#start with 'h'~heart#start with 'h'~half#start with 'h'~hair#start with 'h'~hole#start with 'h'~help#start with 'h'~huh#start with 'h'~home#start with 'h'~honor#start with 'h'~host#start with 'h'~help#start with 'h'~her#start with 'h'~herb# start with 'h'~huge#start with 'h'~hi#start with 'h'~hire#start with 'h'~his#start with 'h'~half#start with 'h'~half#start with 'h'~hall#start with 'h'~hell#start with 'h'~hang#start with 'h'~hint# start with 'h'~honey#start with 'h'~horse#start with 'h'~how#start with 'h'~hook#start with 'h~home#start with 'h'~happy#start with 'h'~hear#start with 'h'~hard#start with 'h'~hour#start with 'h'~hate#start with 'h'~heat#start with 'h'~hot#start with 'h'~host#start with 'h'~human#start with 'h'~hunt#start with 'h'~hour#start with 'i'~ideal#start with 'i' ~issue#start with 'i'~inch#start with 'i'~ice#start with 'i'~idea#start with 'i'~its#start with 'i'~ill#start with 'i'~islam#start with 'i'~irony#start with 'i'~iron#start with 'i'~iron# start with 'i'~is#start with 'i'~its#start with 'j'~jewel#start with 'j'~juice#start with 'j'~join#start with 'j'~job#start with 'j'~jug#start with 'j'~joke#start with 'j'~juror#start with 'j'~jump#start with 'j'~just#start with 'j'~just#start with 'k'~keep#start with 'k'~key#start with 'k'~king#start with 'k'~kiss#start with 'k'~knife#start with 'k'~kind#start with 'k'~king#start with 'k'~knot#start with 'k'~kit#start with 'k'~knot#start with 'l'~later#start with 'l'~lazy#start with 'l'~lock#start with 'l'~lead#start with 'l'~loud#start with 'l'~land#start with 'l'~lead#start with 'l'~left#start with 'l'~life#start with 'l'~lead#start with 'l'~leg#start with 'l'~lemon#start with 'l'~let#start with 'l'~loose#start with 'l'~level#start with 'l'~lid#start with 'l'~life#start with 'l'~like#start with 'l'~lion#start with 'l'~lack#start with 'l'~luck#start with 'l'~link#start with 'l'~look#start with 'l'~lake#start with 'l'~lame#start with 'l'~lamp#start with 'l'~label#start with 'l'~lens#start with 'l'`less#start with 'l'~like#start with 'l'~line#start with 'l'~link#start with 'l'~load#start with 'l'~long#start with 'l'~lot#start with 'l'~liver#start with 'l'~less#start with 'l'~lady#start with 'l'~lime#start with 'l'~limit#start with 'l'~lamp#start with 'l'~lump#start with 'l'~lean#start with 'l'~long#start with 'l'~lion#start with 'l'~load#start with 'l'~lock#start with 'l'~look#start with 'l'~look#start with 'l'~lower#start with 'l'~lose#start with 'l'~lot#start with 'l'~lover#start with 'l'~lip#start with 'l'~loop#start with 'l'~lens#start with 'l'~lady#start with 'l'~lay#start with 'm'~made#start with 'm'~many#start with 'm'~may#start with 'm'~much#start with 'm'~meal#start with 'm'~meat#start with 'm'~medal#start with 'm'~mere#start with 'm'~menu#start with 'm'~more#start with 'm'~more#start with 'm'~melt#start with 'm'~metal#start with 'm'~meow#start with 'm'~milk#start with 'm'~movie#start with 'm'~mix#start with 'm'~miss#start with 'm'~might#start with 'm'~meat#start with 'm'~mass#start with 'm'~much#start with 'm' ~main#start with 'm'~mind#start with 'm'~mask#start with 'm'~moral#start with 'm'~most#start with 'm'~mark#start with 'm'~ms#start with 'm'~mrs#start with 'm'~music#start with 'm'~mixed#start with 'm'~mine#start with 'm'~mood#start with 'm'~major#start with 'm' ~moon#start with 'm'~mood#start with 'm' ~most#start with 'm'~more#start with 'm'~marry#start with 'm'~mass#start with 'm'~mess#start with 'm'~mist#start with 'm'~much#start with 'm'~mix# start with 'm'~myth#start with 'm'~mayor# start with 'n'~nice#start with 'n'~nice#start with 'n'~news#start with 'n'~newly#start with 'n'~next#start with 'n'~never#start with 'n'~night#start with 'n'~neck#start with 'n'~name#start with 'n'~neat#start with 'n'~next#start with 'n'~no#start with 'n'~note#start with 'n'~now#start with 'n'~nose#start with 'n'~nod#start with 'n'~none#start with 'n'~note#start with 'n'~nest#start with 'n'~net#start with 'n'~next#start with 'n'~nut#start with 'n'~nurse#start with 'n'~new#start with 'n'~now#start with 'o'~oak#start with 'o'~okay#start with 'o'~once#start with 'o'~ought#start with 'o'~ok#start with 'o'~ocean#start with 'o'~one#start with 'o'~only#start with 'o'~owner#start with 'o'~open#start with 'o'~onto#start with 'o'~organ#start with 'o'~odd#start with 'o'~one#start with 'o'~off#start with 'o'~on#start with 'o'~onion#start with 'o'~ore#start with 'o'~only#start with 'o'~open#start with 'o'~order#start wih 'o'~occur#start with 'o'~orbit#start with 'o'~other#start with 'o'~our#start with 'o'~over#start with 'p'~peak#start with 'p'~park#start with 'p'~panel#start with 'p'~palm#start with 'p'~pad#start with 'p'~page#start with 'p'~pan#start with 'p'~party#start with 'p'~piece#start with 'p'~pc#start with 'p'~pale#start with 'p'~pause#start with 'p'~phone#start with 'p'~pen#start with 'p'~║phase#start with 'p'~push#start with 'p'~price#start with 'p'~pin#start with 'p'~pizza#start with 'p'~pink#start with 'p'~play#start with 'p'~pull#start with 'p'~pan#start with 'p'~print#start with 'p'~plan#start with 'p'~pond#start with 'p'~pin#start with 'p'~plot# start with 'p'~poor#start with 'p'~pilot#start with 'p'~pour# start with 'p'~park# start with 'p'~pitch#start with 'p'~peace#start with 'p'~page#start with 'p'~pole#start with 'p'~proof#start with 'p'~paint#start with 'p'~pick#start with 'p'~pig#start with 'p'~pick#start with 'p'~play#start with 'p'~pump#start with 'p'~piano#start with 'p'~pool#start with 'p'~prove#start with 'p'~part#start with 'p'~purse#start with 'p'~press#start with 'p'~pat#start with 'p'~pant#start with 'p'~part#start with 'p'~power#start with 'p'~pork#start with 'p'~prize#start with 'p'~pray#start with 'p'~path#start with 'p'~point#start with 'p'~pet#start with 'p'~past#start with 'p'~plus#start with 'p'~put#start with 'p'~pay#start with 'p'~play#start with 'q'~quiet#start with 'q'~queen#start with 'r'~read#start with 'r'~react#start with 'r'~rain#start with 'r'~rub#start with 'r'~re#start with 'r'~real#start with 'r'~ready#start with 'r'~river#start with 'r'~rule#start with 'r'~rich#start with 'r'~rough#start with 'r'~rich#start with 'r'~rush#start with 'r'~rain#start with 'r'~rib# start with 'r'~ratio#start with 'r'~rise#start with 'r'~risk#start with 'r'~roll#start with 'r'~rally#start with 'r'~reply#start with 'r'~rank#start with 'r'~rot#start with 'r'~round#start with 'r'~race#start with 'r'~rape#start with 'r'~ray#start with 'r'~rack#start with 'r'~rain#start with 'r'~riot#start with 'r'~rule#start with 'r'~rod#start with 'r'~rest#start with 'r'~rude#start with 'r'~rest#start with 'r'~root#start with 'r'~rat#start with 'r'~run#start with 'r'~route#start with 'r'~rush#start with 's'~scale#start with 's'~same#start with 's'~shall#start with 's'~smash#start with 's'~shock#start with 's'~sad#start with 's'~send#start with 's'~same#start with 's'~space#start with 's'~slice#start with 's'~slide#start with 's'~seed#start with 's'~shoe#start with 's'~same#start with 's'~swear#start with 's'~sell#start with 's'~send#start with 's'~shoe#start with 's'~steel#start with 's'~sex#start with 's'~step#start with 's'~save#start with 's'~shift#start with 's'~soft#start with 's'~sight#start with 's'~shine#start with 's'~such#start with 's'~she#start with 's'~shed#start with 's'~shut#start with 's'~sin#start with 's'~spill# start with 's'~shirt#start with 's'~sigh#start with 's'~sink#start with 's'~soil#start with 's'~sir#start with 's'~swim#start with 's'~seize#start with 's'~stake#start with 's'~sake#start with 's'~silk#start with 's'~sky#start with 's'~slope#start with 's'~silly#start with 's'~slip#start with 's'~skill#start with 's'~slow#start with 's'~slam#start with 's'~storm# start with 's'~some#start with 's'~sand#start with 's'~song#start with 's'~skin#start with 's'~soon# start with 's'~score#start with 's'~soil#start with 's'~soap#start with 's'~sort#start with 's'~sorry#start with 's'~spark#start with 's'~spend#start with 's'~steep#start with 's'~stop#start with 's'~super#start with 's'~spray#start with 's'~strip#start with 's'~sac#start with 's'~sales#start with 's'~scan#start with 's'~stand#start with 's'~send#start with 's'~shell#start with 's'~some#start with 's'~set#start with 's'~stem#start with 's'~sexy#start with 's'~soft#start with 's'~sick#start with 's'~side# start with 's'~suit# start with 's'~skin#start with 's'~sell#start with 's'~smile#start with 's'~shore#start with 's'~son#start with 's'~spade#start with 's'~seat# start with 's'~stem# start with 's'~sure#start with 's'~sum#start with 's'~sun#start with 's'~sixth#start with 's'~sheet#start with 's'~sit#start with 's'~stir#start with 's'~short#start with 's'~skirt# start with 's'~stop#start with 's'~stove#start with 's'~stuff#start with 's'~such#start with 's'~swim#start with 's'~sex#start with 's'~say#start with 's'~size#start with 't'~that#start with 't'~total#start with 't'~than#start with 't'~tea# start with 't'~tear#start with 't'~tail#start with 't'~trade#start with 't'~toxic#start with 't'~track#start with 't'~tired#start with 't'~tube#start with 't'~tide#start with 't'~taste#start with 't'~trash#start with 't'~thin#start with 't'~thumb#start with 't'~tie#start with 't'~tire#start with 't'~this#start with 't'~take#start with 't'~tall#start with 't'~till# start with 't'~talk#start with 't'~tell#start with 't'~tumor#start with 't'~teen#start with 't'~tool#start with 't'~tour#start with 't'~too#start with 't'~two#start with 't'~toy#start with 't'~throw#start with 't'~trust#start with 't'~trim#start with 't'~troop#start with 't'~truly#start with 't'~tax#start with 't'~type#start with 't'~teach#start with 't'~title#start with 't'~tile#start with 't'~tune#start with 't'~toe#start with 't'~too#start with 't'~top#start with 't'~try#start with 't'~toss#start with 't'~twist#start with 't'~tent#start with 't'~tight#start with 't'~test# start with 't'~twin#start with 't'~town#start with 't'~taxi#start with 't'~type#start with 'u'~upset#start with 'u'~unite#start with 'u'~uh#start with 'u'~unit#start with 'u'~ugly#start with 'u'~union#start with 'u'~under#start with 'u'~up#start with 'u'~use#start with 'u'~unit#start with 'u'~usual#start with 'u'~until#start with 'u'~us#start with 'v'~via#start with 'v'~virus#start with 'v'~vast#start with 'v'~valid#start with 'v'~vital#start with 'v'~vote#STart with 'w'~weak#start with 'w'~wake#start with 'w'~walk#start with 'w'~was#start with 'w'~wood#start with 'w'~weak#start with 'w'~where#start with 'w' ~wet#start with 'w' ~wheat#start with 'w' ~wake#start with 'w' ~west#start with 'w' ~wing# start with 'w' ~wrong#start with 'w'~wash#start with 'w' ~when#start with 'w'~who#start with 'w'~white# start with 'w'~who#start with 'w'~wash#start with 'w'~wish#start with 'w'~wife#start with 'w'~will#start with 'w'~wine#start with 'w'~week# start with 'w'~well#start with 'w'~wound# start with 'w'~world#start with 'w'~work#start with 'w'~wow#start with 'w'~wrap#start with 'w'~weird#start with 'w'~wear#start with 'w'~word#start with 'w'~worm# start with 'w'~warm# start with 'w'~wax#start with 'w'~wide#start with 'w'~wild#start with 'w'~would#start with 'w'~wage#start with 'w'~wide#start with 'w'~wet#start with 'w'~while#start with 'w'~with#start with 'w'~wise#start with 'w'~well#start with 'w'~went#start with 'w'~wagon#start with 'w'~whom#start with 'w'~wet#start with 'w'~way#start with 'w'~why#start with 'w'~way#start with 'y'~year#start with 'y'~yeah#start with 'y'~yes#start with 'y'~year#start with 'y'~yes# start with 'y'~yet#start with 'z'~zero#start with 'z'~zinc#start with 'z'~zoo#Start With 'a'~away#Start With 'a'~aamir#Start With 'a' ~attractive#Start With 'a'~ambitious#Start With 'a'~ali# Start With 'a'~adorable#Start With 'a'~apply#Start With 'a'~attitude#Start With 'a'~about#Start With 'a'~alone#Start With 'a'~america#Start With 'a'~amazingly#Start With 'a' ~apple#Start With 'a'~aunty#Start With 'b'~bear#Start With 'b'~bar#Start With 'b'~building#Start With 'b'~business#Start With 'b'~better#Start With 'b'~bed#Start With 'b'~behave#Start With 'b'~behind#Start With 'b'~bet#Start With 'b'~balance#Start With 'b'~beer#Start With 'b'~beef# Start With 'b'~bing#Start With 'b'~biriyani#Start With 'b'~bite#Start With 'b'~blame#Start With 'b'~bun#Start With 'b'~born#Start With 'b'~photo#Start With 'b'~brb#Start With 'b'~barber#Start With 'b'~bit#Start With 'b'~best#Start With 'b'~butter#Start With 'b'~burn#Start With 'b'~by#Start With 'b'~ball#Start With 'b'~ben#Start With 'b'~bill#Start With 'b'~blast#Start With 'b'~but#Start With 'b'~ban#Start With 'b'~bat#Start With 'b'~bot#Start With 'b'~but#Start With 'b'~bowl#Start With 'b'~bowling#Start With 'c'~chan#Start With 'c' ~claw#Start With 'c'~clock# Start With 'c'~cotton#Start With 'c'~country#Start With 'c'~camp#Start With 'c'~crack#Start With 'c'~cracker#Start With 'c'~charming#Start With 'c'~cheese#Start With 'c'~complex#Start With 'c'~camera#Start With 'c'~confusing#Start With 'c'~caring#Start With 'c'~cat#Start With 'c'~cow#Start With 'c'~clock#Start With 'c'~chatroom# Start With 'c'~cash#Start With 'c'~click#Start With 'c'~copper#Start With 'c'~cop#Start With 'c'~cort#Start With 'c'~cutter#Start With 'c'~cell#Start With 'c'~change#Start With 'c'~china#Start With 'c'~chain#Start With 'c'~chater#Start With 'c'~crown#Start With 'c'~chat#Start With 'c'~call#Start With 'c'~camb#Start With 'c'~can#Start With 'c'~copy#Start With 'c'~car#Start With 'c'~card#Start With 'c'~cot#Start With 'd'~dead#Start With 'd'~dash#Start With 'd'~drag#Start With 'd'~duck#Start With 'd'~death# Start With 'd'~dhoni#Start With 'd'~door#Start With 'd'~driving#Start With 'd'~don#Start With 'd'~danger#Start With 'd'~driving# Start With 'd'~drew#Start With 'd'~drive#Start With 'd'~dear# Start With 'd'~dish#Start With 'd'~doll# Start With 'd'~door#Start With 'd'~drum#Start With 'd'~drug#Start With 'd'~drow#Start With 'd'~display#Start With 'd'~darkness#Start With 'd'~dazzling#Start With 'd'~driver#Start With 'd'~dam#Start With 'd'~dinner#Start With 'd'~darling#Start With 'd'~dot#Start With 'd'~daughter#Start With 'e'~earn#Start With 'e'~edit#Start With 'e'~energetic#Start With 'e'~energy#Start With 'e'~eyebrow#Start With 'e'~end#Start With 'e'~elegant# Start With 'e'~england#Start With 'e'~education#Start With 'e'~east#Start With 'e'~egg#Start With 'e'~elbow#Start With 'e'~emotion#Start With 'e'~emo#Start With 'e'~entry# Start With 'e'~enter#Start With 'e'~extra#Start With 'e'~eye#Start With 'e'~end#Start With 'e'~exist#Start With 'e'~exit#Start With 'e'~ear#Start With 'f'~fat#Start With 'f'~fire#Start With 'f'~fire#Start With 'f'~fried#Start With 'f'~fifteen#Start With 'f'~fight#Start With 'f'~fellow#Start With 'f'~facebook#Start With 'f'~faithful#Start With 'f'~fold#Start With 'f'~family#Start With 'f'~female#Start With 'f'~fantastic#Start With 'f'~flop#Start With 'f'~fourty#Start With 'f'~friendly#Start With 'f'~five#Start With 'f'~fish#Start With 'f'~flame#Start With 'f'~fan#Start With 'f'~fork#Start With 'f'~flot#Start With 'f'~frod#Start With 'f'~for#Start With 'f'~fry#Start With 'f'~frog#Start With 'f'~fast#Start With 'f'~fast#Start With 'f'~fun#Start With 'f'~four#Start With 'f'~faimous#Start With 'f'~faster#Start With 'f'~fever#Start With 'f'~fifty#Start With 'f'~fifth#Start With 'f'~following#Start With 'f'~friendly#Start With 'f'~friend#Start With 'f'~flip#Start With 'f'~friend#Start With 'f'~film#Start With 'g'~gentleman#Start With 'g'~gentle#Start With 'g'~girl#Start With 'g'~go#Start With 'g'~gangster#Start With 'h'~heart#Start With 'h'~happy#Start With 'h'~high#Start With 'h'~hindi#Start With 'i'~idea#Start With 'i' ~intelligent# Start With 'i'~india#Start With 'i'~india#Start With 'i'~instrument#Start With 'i'~ideal#Start With 'j'~japan#Start With 'j'~journey#Start With 'j'~jump#Start With 'j'~jaan#Start With 'k'~killer#Start With 'k'~knife#Start With 'k'~kerala#Start With 'k'~king#Start With 'l'~leave#Start With 'l'~lazer#Start With 'l'~love#Start With 'l'~language#Start With 'l'~loop#Start With 'l'~love#Start With 'l'~lovely#Start With 'l'~low#Start With 'l'~lime#Start With 'l'~letter#Start With 'm'~mobile#Start With 'm'~malayalam#Start With 'm'~multipurpose#Start With 'm'~morning#Start With 'm'~marvelous#Start With 'm'~married#Start With 'm'~mount#Start With 'm'~minister#Start With 'm'~machine#Start With 'n'~nice#Start With 'n'~nepal#Start With 'n'~necessary#Start With 'n'~north#Start With 'n'~natural#Start With 'n'~naughty#Start With 'n'~nimbuzz#Start With 'o'~officer#Start With 'o'~owner#Start With 'o'~one# Start With 'p'~phone#Start With 'p'~pakistan#Start With 'p'~paper#Start With 'p'~potato#Start With 'p'~power#Start With 'p'~port#Start With 'q'~quit#Start With 'q'~quarter#Start With 'q'~quality#Start With 'r'~royal#Start With 'r'~red#Start With 'r'~rocket#Start With 'r'~regret#Start With 'r'~rape#Start With 'r'~responsible#Start With 'r'~river#Start With 's'~spelling#Start With 's'~science#Start With 's'~super#Start With 's'~song#Start With 's'~sing#Start With 's'~scooter#Start With 's'~story#Start With 's'~star#Start With 's'~smart#Start With 's'~sparkling#Start With 's'~superman#Start With 's'~system#Start With 's'~seductive#Start With 's'~singer#Start With 's'~serious#Start With 's'~style#Start With 's'~silent#Start With 's'~sing#Start With 's'~super#Start With 's'~sweet#start With 't'~tea#Start With 't'~ticket#Start With 't'~tall#Start With 't'~transport#Start With 't'~tamil#Start With 't'~turn#Start With 't'~three#Start With 'u'~uncle#Start With 'u'~umbrella#Start With 'u'~unique#Start With 'v'~viewer#Start With 'v'~view#Start With 'w'~wing#Start With 'w'~weather#Start With 'w'~wonderful#Start With 'w'~window#Start With 'w'~win#Start With 'y'~yellow#Start With 'y'~youth#Start With 'y'~yes#start With 'z'~zing#what is capital of phillipines~manila#where the king palace of saudi arabia~riyadh#What does 'www' stand for in a website browser?~World Wide Web#How long is an Olympic swimming pool (in meters)?~50 meters#What countries made up the original Axis powers in World War II?~Germany/Italy/Japan#Which country do cities of Perth, Adelade & Brisbane belong to?~Australia#What geometric shape is generally used for stop signs?~Octagon#What is 'cynophobia'?~Fear of dogs#What punctuation mark ends an imperative sentence?~period#Who named the Pacific Ocean?~Ferdinand Magellan#What is the name of the man who launched eBay back in 1995?~Pierre Omidyar#What is the name of the biggest technology company in South Korea?~Samsung#Which animal can be seen on the Porsche logo?~Horse#Which monarch officially made Valentine's Day a holiday in 1537?~Henry VIII#Who was the first woman to win a Nobel Prize (in 1903)?~Marie Curie#The first dictionary was written by?~Robert Cawdrey#Worship of Krishna is observed by which Religious Faith?~Hinduism#What is the name of the World's largest ocean?~Pacific Ocean#Demolition of the Berlin wall separating East and West Germany began in what year?~1989#What is the romanized Arabic word for 'moon'?~Qamar#Who was the first woman pilot to fly solo across the Atlantic?~Amelia Earhart#What is the rarest M&M color?~Brown#What is the common name for dried plums?~Prunes#Which country consumes the most chocolate per capita?~Switzerland#What is the name given to Indian food cooked over charcoal in a clay oven?~Tandoori#What was the first soft drink in space?~Coca Cola#What is the most consumed manufactured drink in the world?~Tea#Which is the only edible food that never goes bad?~Honey#Which country invented ice cream?~China#'Hendrick's,' 'Larios,' and 'Seagram’s' are some of the best-selling brands of which spirit?~Gin#From which country does Gouda cheese originate?~Netherlands#What TV series showed the first interracial kiss on American network television?~Star Trek#Which Disney Princess talks to the most animals?~Snow White#Which member of the Beatles married Yoko Ono?~John Lennon#What famous US festival hosted over 350,000 fans in 1969?~Woodstock#When Walt Disney was a child, which character did he play in his school function?~Peter Pan#Which Former NBA Player Was Nicknamed 'Agent Zero'?~Gilbert Arenas#Which Basketball team has completed two threepeats?~Chicago Bulls#What sport is dubbed the 'king of sports'?~Soccer#Dump, floater, and wipe are terms used in which team sport?~Volleyball#How many points did Michael Jordan score on his first NBA game?~16 points#what is the darkest color~Black#What's the fastest land animal?~Cheetah#In little red riding hood, who does the wolf dress up as?~Grandmother#Who is the patron saint of Ireland?~St. Patrick#How many colors are there in the rainbow?~Seven#What color is a ruby?~Red#In the poem Humpty Dumpty, where was Humpty when he fell?~wall#What country is responsible for creating the Olympic Games?~Greece#What is Earth's largest continent?~Asia#What's the smallest country in the world?~Vatican#Area 51 is located in which U S state?~Nevada#What country touches the Indian Ocean, the Arabian Sea, and the Bay of Bengal?~India#What's the city with the most diversity in terms of language?~New York City#The ancient Phoenician city of Constantine is located in what modern-day Arab country?~Algeria#Which country borders 14 nations and crosses 8 time zones?~Russia#Havana is the capital of what country?~Cuba#What country has the most natural lakes?~Canada#Which Central American country has a name which translates to English as 'The Saviour'?~El Salvador#In what country would you find Lake Bled?~Slovenia#The unicorn is the national animal of which country?~Scotland#Henry's pockets' or cutaneous marginal pouches A group of ravens is known as?~Unkindness#Spiny anteater and the duck-billed platypus What type of animal is a Flemish giant?~Rabbit#The name of which African animal means 'river horse'?~Hippopotamus#In what type of matter are atoms most tightly packed?~Solids#What is the opposite of matter?~Antimatter#What is the nearest planet to the sun?~Mercury#What color is your blood when it’s inside your body?~Red#What is the largest planet in the solar system?~Jupiter#What's the largest bone in the human body?~Femur#What is a duel between three people called?~Truel#In the state of Georgia, it’s illegal to eat what with a fork?~Fried chicken#Iceland diverted roads to avoid disturbing communities of what?~Elves#In public places in the state of Florida, what's illegal to do when wearing a swimsuit?~Sing#What is the original Latin word for 'vomit'?~Vomitare#How long is New Zealand’s Ninety Mile Beach? How long is New Zealand’s Ninety Mile Beach?~55 miles#What can be broken but is never held?~promise#What does come down but never goes up?~Rain#Despite the name, the Spanish riding school is in which European city?~Vienna#Zaragoza, Valencia, and Malaga are cities in which country?~Spain#How many countries are in the European Union?~27#Daintree Rainforest is a national park in which country?~Australia#Piccadilly, Jubilee, and Central are lines on which city's metro system?~London#Bavaria is a region in the south of which country?~Germany#The Barossa Valley in Australia is famous for producing which drink?~Wine#Jasper National Park is in which country?~Canada#A billabong is a long, narrow lake in which country?~Pakistan#Which country's flag has an eagle and a snake on it?~Mexico#Mounties are police officers in which country?~Canada#Lesotho is completely surrounded by which other country?~South Africa#The Dordogne region is in which European country?~France#Which country takes its name from the Latin word for~Agentina#What's the world's largest ocean?~Arctic Ocean#In which Connecticut city would you find Ivy League Yale University?~New Haven#Montserrat Caballe was famous in which field of the Arts?~Music#Wallonia and Flanders are regions of which European country?~Belgium#Poland's flag is red, and which other color?~White#The UNESCO world heritage city of Bagan is in which Asian country?~Myanmar#Murray-Darling is the longest river in which country?~Australia#In which country would you find the Nafud Desert?~Saudi Arabia#Svetlana Savitskaya was the first woman to walk where?~Space#Modern artist Gerhard Richter is from which country?~Germany#Baile Atha Cliath is the local name for which European capital?~Dublin#The tango is an iconic dance from which country?~Argentina#Luzon is the biggest island in which island country?~Philippines#Phoenix is the largest city of which US state?~Arizona#Which country has a volcanic mountain called Popocatapetl?~Mexico#The first European coffee houses opened in which city?~Vienna#The dish of Wiener Schnitzel is named after which capital city?~Vienna#Dialing a number starting +61 connects you to which country?~Australia#The Kariba Dam is located on which river?~Zambezi#Dacia cars are made in which European country?~Romania#The Titanic was built in which United Kingdom city?~Belfast#A motorway called the M25 goes round which European capital?~London#Wild kangaroos live in which country?~Australia#In which European city could you see the 16th-century Bridge of Sighs?~Venice#The Windy City' is which place's most common nickname?~Chicago#The Scottish dessert of cranachan is made using which fruit?~Raspberries#The Colorado town of Aspen is famous for which sport?~Skiing#Keflavik International Airport is in which country?~Iceland#Where would you find a troglodyte living?~Cave#Echidnas are egg-laying mammals native to which country?~Australia#The Blue and White Nile merge in which African city?~Khartoum#The Trevi Fountain is a landmark in which city?~Rome#Reims is at the center of the area in France which produces which drink?~Champagne#The Cariboo Mountains are in which country?~Canada#name of scientist~christopher sholes#name of scientist~alexander graham bell#name of scientist~thomas alva edison#name of scientist~galileo galilei#name of scientist~gottlich daimler#name of racer~alexis masbou#name of racer~sturla fagerhaug#name of racer~alberto moncayo#racer name~simone corsi#racer name~bradley smith#racer name~luca marconi#car brand~chevrolet#car brand~ferrari#car brand~hummer#car brand~mitsubishi#car brand~mercedes benz#car brand~peugeot#brand car~volkswagen#car brand~nissan#city name~balikpapan#city name~banjarmasin#city name~pontianak#city name~denpasar#city name~makassar#city name~bandung#movie title~ice age#film title~doraemon#movie title~shincan#film title~princess and the frog#film title~upin ipin#film title~scooby doo#film title~monsters vs aliens#film title~tom and jerry#film title~naruto#cartoon character~wonder woman#cartoon character~batman#cartoon character~superman#cartoon character~spiderman#cartoon character~the powerpuff girls#cartoon character~felix the cat#cartoon character~woody woodpecker#cartoon character~alvin and the chipmunk#cartoon character~donald duck#figure cartoon~winnie the pooh#cartoon character~betty boop#cartoon character~spongebob squarepants#artist name~nike ardilla#artist name~dian piesesha#artist name~eddy broccoli#artist name~peach goddess#artist name~tia ivanka#artist name~bimbim slank#artist name~julia perez#artist name~annisa bahar#artist name~dorce gamalama#artist name~onky alexander#artist name~della puspita#artist name~parto patrio#artist name~jackie chan#artist name~beyonce knowles#artist name~david copperfield#burial place~sasono sluggish#gassing~farting#difficult to urinate~sickness#breakfast~fried eggs#canned food~sardines#thin body~thin#head cover~helmet#without husband~widow#without wife~widower#eyes of heart~conscience#new born~orok#artist name~clay aiken#artist name~brad pitt#artist name~tom cruise#artist name~larry king#artist name~christina aguilera#group band~box#group band~yovie and nuno#group band~armada#group band~st12#group band~vierra#group band~utopia#group band~drive#group band~dygta#song title~always love#song title~susis#song title~ordinary human being#song title~about taste#song title~because i can afford it#song title~one less lonely girl#song title~i want to be faithful#song title~the storm is now over#song title~a gift of love#song title~love you to death#song title~condet#song title~poker face#song title~love half to death#movie title~resident evil afterlife#film title~the other guys#movie title~sweetheart#film title~high lane#film title~bright star sony ericsson#hp brand~blackberry#hp brand~apple#hp brand~ipaq pda#most expensive car~bugatti veyron#most expensive car~lamborghini reventon#most expensive car~mclaren f1#most expensive car~pagani zonda#most expensive car~ssc ultimate aero#chemical elements~hydrogen#chemical elements~oxygen#saga~sangkuriang#saga~cucumber mas#saga~langur kasarung#saga~golden watermelon#i'm really~beautiful and sexy#let's say~i'm ugly#i'm really~handsome and rich#i'm really~spoilt but shy#i'm really~shy but aggressive#i'm really~rich is okay to have#i'm really~no one beats you#social networking~facebook#social networking~google buzz#social networking~twitter#social networking~plurk#social terms~campret#romantik~approach#romantic~suicide#romantic~beautiful#romantik~laughter#romantik~kesemsem#romantik~first glance#romantic~crying last night#romantic~dilemma#romantic~upset abis#provider~proxl#provider~indosat#provider~axis#song title~bald hoe#song title~cublak cublak suweng#song title~ampar amparbanana#prokem language~overly kwetiau#culinary~soto tripe#culinary~roasted ribs soup#culinary~fried soy sauce chicken#culinary~crab soup#tourist attractions~ancol#tourist attractions~tanah lot#tourist attractions~bedugul#tourist attractions~beautiful indonesian mini garden#tourist attractions~suramadu bridge#name of this room~indonesia chating#armament tool~grenade launcher#armament tool~knife#armament tool~bayonet#armament tool~binuclear#armament tool~steel tank#application word processor~microsoft word#mattress pad~sheets#special food~jengkol stew#scientist name~james watt#comedian name~charlie chaplin#database app name~oracle#television show~world in the news#animal name~hayena#browser name~opera mini#cellphone brand~blackberry#provider celullar~telkomsel#social terms~cranky#computer terms~source code#science terms~postulate#kitchen tools~gas stove#parts of the body~knee#businessman name~arifin panegoro#prokem language~spokat#song titles~heart concubine#chat application~miranda#animal name~red ants#special food~lead rice#artist name~michael jackson#song title~love secretly#comedian name~flabby#finish reading~khatam#getting old~elderly#animal name~crab#special food~cotto makassar#vehicle brand~ducati#artist name~ahmad dhani#tennis term~deuce#techniques in making love#bilyard stick brand~predator#weekend~sunday#animal name~tiger#chemical element~plutonium#fill in physics~velocity#place name~tower of pisa#city name~rotherdam#plane inventor~wright brothers#martial science~aikido#running fast~stirring#linux creator~linus trovalz#search engine~hotbot, scout level, raiser, romance, broken heart, browser name, neoplanet, slang language, mother's father, cigarette name~lucky strike#robot chat~helpbot#marriage term~ijab qabul#mango name~gedong gincu#being alone~single#soap name~biore#angel name~jibril#football coach~jose morinho#god's character~arrahman#food name~lempok durian#type if you dare~i'm a monkey#name of food~baked pempek#name of mall~malioboro#name of religion~zoroaster#name of university~cendrawasih#football player~lionel messi#name of racer~pedrosa#name of galaxy~andromeda#celestial body~halley's comet#movie title~jurassic park#name of food~gudeg#new item~anyar#city name~madrid#tourist spot~lake batur#underware~kancut#plane name~tomcat#number of stars~how do i know#football game~winning eleven#can't move~jammed#language name~urdu#original tribe name~aborigines#underwear~cangcut#scheduled meeting~night sunday#fish name~cork#sleeping sickness~insomnia#last day~doomsday#other words i'm stupid~i'm under#my brother~monkey#haircut place~salon#science of pellets~jaran goyang#names of animals~dinosaurs#public transportation~oplet#tourist attractions~sihanok canyon#special food~rujak cingur#news office~antara#song titles~play hearts#artist names~thumb arwana#comedy shows~opera van java#computer term~warm boot#paranormal name~ki joko bodo#treatment place~hospital#traffic signs~traffic light#color name~violet#december month name#holidays~nyepi#cooking tools~pot#artist name~edward van hallen#climbing tool~backpack#special food~papeda#local dance~pendet#fruit name~kiwi#disease name~bone flu#search engine~altavista#divorced term~single parent#boxer name~mike tyson#football term~handball#hot artist~miyabi#national symbol~garuda#scientist name~isac newton#romance~falling in love#football club~barcelona#travel spots~kaliurang#car name~argojati#no money~broken#denomination money~ceban#brand vehicle~kawasaki#tobacco poison~nicotine#romance~in love#famous song~snail poison#ghost name~kuntilanak#hero name~sudirman#artist name~andideriz#ghost name~kolor green#contraceptives~condom#three-tiered crown~tiara#name of cake~black forest#sunan cirebon~mountain teak#social term~i think of it#penerang~pelita#name of food~satay goat#car name~daihatsu#name of food~fried chicken#bird's name~older brother#fast food~indomie goreng#musical instrument~electric guitar#city name~manila#famous entrepreneur~bill gates#computer brand~sony vaio#chating application~chating warrior#types of diseases~crazy#types of food~fried bananas#indochat owner~sisiel m0et#browser name~mozilla#name of artist~anjasmara#type of season~summer#chat application~nimbuzz#type of computer~laptop#brand of mineral water~aqua#artist name~joe satriani#author romeobot~romeo must die#name of food~sari roti#type of dish~rendang padang#visual basic programming language#scientist name~albert einstein#chubby cheeks~cubby#artist name~rio febrian#cigarette name~sun salt warehouse#cellphone brand~nokia#president name~soekarno#animal name~cat#motorcycle brand~honda#food name~pizza hut#comma punctuation#fruit name~mango#animal name~goat#furniture~pot#fish name~grouper#city name~surabaya#operating system~windows#animal name~komodo#sport type~football#public vehicle~busway#modem brand~huawei#cigarette brand~marlboro#detergent brand~rinso#type of clothing~shirt#name of hero~pattimura#name of prophet~sulaiman#sports~badminton#racer~valentino rossi#name of fruit~guava bol#jam brand~alba#city name~manado#operating system~linux#helmet brand~nolan#presidential name~habibie#disease name~kidney failure#food name~gejrot tofu#artist name~dian sastro#special food~sega jamblang#film title~titanic#hikayat~ebay malang#fruit name~longan#name of university~brawijaya#my name :d~romeobot#laptop brand~lenovo#cigarette name~chocolate needle#artist name~luna maya#connection tool~modem#food name~pindang catfish#fruit name~cucumber suri#artist name~mbah surip#cake name~cucur#teenage term~abg#artist name~puspa point#animal name~tyrex#food name~bread dry#name of softdrink~sprite#prayer tool~prayer mat#book of beliefs~darmogandul#name of animal~cricket#vehicle brand~hyundai#name of food~bika ambon#name of food~chicken rica rica#name of food~egg crust#name of food~empal gentong#name of food~soto lamongan#name of food~ayam betutu#name of food~klappertaart#name of kingdom~majapahit#name of kingdom~sriwijaya#name of kingdom~pajajaran#name of kingdom~singhasari#name of kingdom~kutai kartanegara#name of island~sumatra#island name~kalimantan#island name~sulawesi#river~bengawan solo#river~mississippi#river~missouri#river~amazon fierce#beast~leopard#beast~retreat#beast~giraffe"; // Example default questions

// =====================================
// PARSE QUESTIONS
// =====================================

function parseQuestions() {

    const arr = [];

    const split =
        defaultQuestions.split("#");

    for (const item of split) {

        const parts =
            item.split("~");

        if (parts.length < 2)
            continue;

        arr.push({

            question:
            parts[0].trim(),

            answer:
            parts[1]
            .trim()
            .toLowerCase()

        });

    }

    return arr;

}

const words = parseQuestions();

// =====================================
// RANDOM
// =====================================

function rand(min, max) {

    return Math.floor(
        Math.random() *
        (max - min + 1)
    ) + min;

}

// =====================================
// SCRAMBLE WORD
// =====================================

function scrambleWord(word) {

    let arr = word.split("");

    for (
        let i = arr.length - 1;
        i > 0;
        i--
    ) {

        const j =
            Math.floor(
                Math.random() *
                (i + 1)
            );

        [arr[i], arr[j]] =
        [arr[j], arr[i]];

    }

    let result = arr.join("");

    // avoid same word
    if (
        result.toLowerCase() ===
        word.toLowerCase()
    ) {

        return scrambleWord(word);

    }

    return result;

}

// =====================================
// START QUIZ
// =====================================

function startQuiz(socket, room) {

    if (timers[room])
        return;

    console.log(
        "[QUIZ START]",
        room
    );

    createQuestion(
        socket,
        room
    );

}

// =====================================
// STOP QUIZ
// =====================================

function stopQuiz(room) {

    if (timers[room]) {

        clearTimeout(
            timers[room]
        );

        delete timers[room];

    }

    delete active[room];

}

// =====================================
// CREATE QUESTION
// =====================================

// =====================================
// CREATE QUESTION
// =====================================

function createQuestion(
    socket,
    room
) {

    if (!socket)
        return;

    if (socket.readyState !== 1)
        return;

    let question = "";
    let answer = "";
    let scrambled = "";
    let hint = "";

    // 1 = math
    // 2 = scramble
    // 3 = normal

    const mode = rand(1, 3);

    // =================================
    // MATH
    // =================================

    if (mode === 1) {

        const a = rand(1, 30);
        const b = rand(1, 30);

        question =
        `🧮 Solve:\n${a} + ${b}`;

        answer =
        String(a + b);

    }

    // =================================
    // SCRAMBLE WITH QUESTION
    // =================================

    else if (mode === 2) {

        const pick =
            words[
                rand(
                    0,
                    words.length - 1
                )
            ];

        answer =
            pick.answer
            .toLowerCase()
            .trim();

        scrambled =
            scrambleWord(answer);

        question =

`${pick.question}

🔀 Scrambled:
${scrambled}`;

    }

    // =================================
    // NORMAL QUESTION
    // =================================

    else {

        const pick =
            words[
                rand(
                    0,
                    words.length - 1
                )
            ];

        question =
            pick.question;

        answer =
            pick.answer
            .toLowerCase()
            .trim();

    }

    // =================================
    // HINT
    // =================================

    if (answer.length >= 2) {

        hint =
            answer[0] +
            " " +
            "_ ".repeat(
                answer.length - 2
            ) +
            answer[
                answer.length - 1
            ];

    } else {

        hint = answer;

    }

    // =================================
    // SAVE ACTIVE QUIZ
    // =================================

    active[room] = {

        question,

        answer,

        scrambled,

        hint,

        repeat: 0,

        locked: false,

        time: Date.now()

    };

    askLoop(
        socket,
        room
    );

}

// =====================================
// ASK LOOP
// =====================================

function askLoop(
    socket,
    room
) {

    const q =
        active[room];

    if (!q)
        return;

    if (q.locked)
        return;

    q.repeat++;

const styles = [

`❓ QUIZ QUESTION

${q.question}

💡 Type:
hint`,

`🧠 Still no answer?

${q.question}`,

`⚡ QUICK ANSWER

${q.question}`,

`🔥 Nobody knows?

${q.question}`,

`⏰ Last chance!

${q.question}`

];

    sendRoom(

        socket,
        room,
        styles[
            q.repeat - 1
        ]

    );

    // LAST REPEAT
    if (q.repeat >= 5) {

        timers[room] =
        setTimeout(() => {

            if (
                active[room] &&
                !active[room]
                .locked
            ) {

                sendRoom(

                    socket,
                    room,

`❌ Nobody answered correctly

✅ Correct Answer:
${q.answer}`

                );

            }

            delete active[room];

            setTimeout(() => {

                createQuestion(
                    socket,
                    room
                );

            }, 10000);

        }, 15000);

        return;

    }

    // NEXT LOOP
    timers[room] =
    setTimeout(() => {

        askLoop(
            socket,
            room
        );

    }, 15000);

}

// =====================================
// HANDLE ANSWER
// =====================================

function handleAnswer(

    socket,
    room,
    user,
    msg

) {

    const q =
        active[room];

    if (!q)
        return;

    if (q.locked)
        return;

    const text =
        String(msg)
        .toLowerCase()
        .trim();

    if (text !== q.answer)
        return;

    q.locked = true;

    clearTimeout(
        timers[room]
    );

    const speed =
    (
        Date.now() -
        q.time
    ) / 1000;

    let scores =
        loadJSON(
            "./storage/scores.json",
            {}
        );

    if (!scores[user]) {

        scores[user] = {

            score: 0,

            bestSpeed: 9999

        };

    }

    let gain =
        rand(5, 25);

    if (speed <= 3)
        gain += 20;

    else if (speed <= 5)
        gain += 10;

    scores[user]
    .score += gain;

    if (
        speed <
        scores[user]
        .bestSpeed
    ) {

        scores[user]
        .bestSpeed =
        speed;

    }

    saveJSON(

        "./storage/scores.json",
        scores

    );

    sendRoom(

        socket,
        room,

`🏆 ${user} ANSWERED CORRECTLY

✅ Answer:
${q.answer}

⚡ Speed:
${speed.toFixed(2)}s

➕ Score Added:
${gain}

🏅 Total Score:
${scores[user].score}`

    );

    delete active[room];

    setTimeout(() => {

        createQuestion(
            socket,
            room
        );

    }, 10000);

}
// =====================================
// ROOM TOP
// =====================================

function getRoomTop(room) {

    const scores =
        loadJSON(
            "./storage/scores.json",
            {}
        );

    const arr = [];

    for (const user in scores) {

        const data = scores[user];

        if (
            data.rooms &&
            data.rooms[room]
        ) {

            arr.push({

                user,

                score:
                data.rooms[room].score,

                best:
                data.rooms[room].bestSpeed

            });

        }

    }

    arr.sort(
        (a, b) =>
        b.score - a.score
    );

    if (arr.length === 0) {

        return "No room scores yet.";

    }

    let text =
`🏆 ROOM TOP PLAYERS 🏆`;

    arr
    .slice(0, 10)
    .forEach((x, i) => {

        text +=

`\n\n${i + 1}. ${x.user}
Score: ${x.score}
Best: ${x.best.toFixed(2)}s`;

    });

    return text;

}
// =====================================
// TOP 10
// =====================================

function getTop10() {

    const scores =
        loadJSON(
            "./storage/scores.json",
            {}
        );

    const arr =
        Object.entries(scores);

    arr.sort(
        (a, b) =>
        b[1].score -
        a[1].score
    );

    let text =`🏆 TOP 10 PLAYERS 🏆`;

    if (arr.length === 0) {

        return `🏆 TOP 10 PLAYERS 🏆

No players yet.`;

    }

    arr
    .slice(0, 10)
    .forEach((x, i) => {

        text +=
`\n\n${i + 1}. ${x[0]}
⭐ Score:${x[1].score}
⚡ Best Speed:${x[1].bestSpeed.toFixed(2)}s`;
    });

    return text;

}

// =====================================
// MY SCORE
// =====================================

function getMyScore(user) {

    const scores =
        loadJSON(
            "./storage/scores.json",
            {}
        );

    if (!scores[user]) {

        return `${user} has no score yet.`;

    }

    return `🏅 PLAYER SCORE

👤 Username:
${user}
⭐ Total Score:
${scores[user].score}
⚡ Best Speed:
${scores[user]
.bestSpeed
.toFixed(2)}s`;

}
// =====================================
// SEND ROOM
// =====================================

function sendRoom(
    socket,
    room,
    body
) {

    try {

        if (!socket)
            return;

        if (
            socket.readyState !== 1
        ) return;

        socket.send(
            JSON.stringify({

                handler:
                "room_message",

                type: "text",

                id:
                "QUIZ-" +
                Date.now(),

                body,

                room,

                url: "",

                length: "0"

            })
        );

    } catch(err) {

        console.log(
            "[QUIZ ERROR]",
            err.message
        );

    }

}

module.exports = {

    startQuiz,
    stopQuiz,
    handleAnswer,
    getTop10,
    getMyScore,
    getRoomTop,
    activeQuiz

};
