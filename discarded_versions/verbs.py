transitives = """
accept
accord
add
admire
admit
advise
afford
agree
alert
allow
amuse
analyse
analyze
announce
annoy
answer
apologise
appear
applaud
appreciate
approve
argue
arrange
arrest
arrive
ask
attach
attack
attempt
attend
attract
avoid
back
bake
balance
ban
bang
bare
bat
bathe
battle
beam
beg
behave
belong
bleach
bless
blind
blink
blot
blush
boast
boil
bolt
bomb
book
bore
borrow
bounce
bow
box
brake
branch
breathe
bruise
brush
bubble
bump
burn
bury
buzz
calculate
call
camp
care
carry
carve
cause
challenge
change
charge
chase
cheat
check
cheer
chew
choke
chop
claim
clap
clean
clear
clip
close
coach
coil
collect
colour
comb
command
communicate
compare
compete
complain
complete
concentrate
concern
confess
confuse
connect
consider
consist
contain
continue
copy
correct
cough
count
cover
crack
crash
crawl
cross
crush
cry
cure
curl
curve
cycle
dam
damage
dance
dare
decay
deceive
decide
decorate
delay
delight
deliver
depend
describe
desert
deserve
destroy
detect
develop
disagree
disappear
disapprove
disarm
discover
dislike
divide
double
doubt
drag
drain
dream
dress
drip
drop
drown
drum
dry
dust
earn
educate
embarrass
employ
empty
encourage
end
enjoy
enter
entertain
escape
examine
excite
excuse
exercise
exist
expand
expect
explain
explode
extend
face
fade
fail
fancy
fasten
fax
fear
fence
fetch
file
fill
film
fire
fit
fix
flap
flash
float
flood
flow
flower
fold
follow
fool
horse
form
found
frame
frighten
fry
gather
gaze
glow
glue
grab
grate
grease
greet
grin
grip
groan
guarantee
guard
guess
guide
hammer
hand
handle
hang
happen
harass
harm
hate
haunt
head
heal
heap
heat
help
hook
hop
hope
hover
hug
hum
hunt
hurry
identify
ignore
imagine
impress
improve
include
increase
influence
inform
inject
injure
instruct
intend
interest
interfere
interrupt
introduce
invent
invite
irritate
itch
jail
jam
jog
join
joke
judge
juggle
jump
kick
kill
kiss
kneel
knit
knock
knot
label
land
last
laugh
launch
learn
level
license
lick
lie
lighten
like
list
listen
live
load
lock
long
look
love
man
manage
march
mark
marry
match
mate
matter
measure
meddle
melt
memorise
mend
milk
mine
miss
mix
moan
mock
moor
mourn
move
muddle
mug
multiply
murder
nail
name
need
nest
nod
note
notice
number
obey
object
observe
obtain
occur
offend
offer
open
order
overflow
owe
own
pack
paddle
paint
park
part
pass
paste
pat
pause
peck
pedal
peel
peep
perform
permit
phone
pick
pinch
pine
place
plan
plant
play
please
plug
point
poke
polish
pop
possess
post
pour
practise
practice
pray
preach
precede
prefer
prepare
present
preserve
press
pretend
prevent
prick
print
produce
program
promise
protect
provide
pull
pump
punch
puncture
punish
push
question
queue
race
radiate
rain
raise
reach
realise
receive
recognise
record
reduce
reflect
refuse
regret
reign
reject
rejoice
relax
release
rely
remain
remember
remind
remove
repair
repeat
replace
reply
report
reproduce
request
rescue
retire
return
rhyme
rinse
risk
rob
rock
roll
rot
rub
ruin
rule
rush
sack
sail
satisfy
save
saw
scare
scatter
scold
scorch
scrape
scratch
scream
screw
scribble
scrub
seal
search
separate
serve
settle
shade
share
shave
shelter
shiver
shock
shop
shrug
sigh
sign
signal
sin
sip
ski
skip
slap
slip
slow
smash
smell
smile
smoke
snatch
sneeze
sniff
snore
snow
soak
soothe
sound
spare
spark
sparkle
spell
spill
spoil
spot
spray
sprout
squash
squeak
squeal
squeeze
stain
stamp
stare
start
stay
steer
step
stir
stitch
stop
store
strap
strengthen
stretch
strip
stroke
stuff
subtract
succeed
suck
suffer
suggest
suit
supply
support
suppose
surprise
surround
suspect
suspend
switch
talk
tame
tap
taste
tease
telephone
tempt
terrify
test
thank
thaw
tick
tickle
tie
time
tip
tire
touch
tour
tow
trace
trade
train
transport
trap
travel
treat
tremble
trick
trip
trot
trouble
trust
try
tug
tumble
turn
twist
type
undress
unfasten
unite
unlock
unpack
untidy
use
vanish
visit
wail
wait
walk
wander
want
warm
warn
wash
waste
watch
water
wave
weigh
welcome
whine
whip
whirl
whisper
whistle
wink
wipe
wish
wobble
wonder
work
worry
wrap
wreck
wrestle
wriggle
x-ray
yawn
yell
zip
zoom
""".splitlines()
intransitives = """
kid
sleep
stop
""".splitlines()
ditransitives = """
call
grudge
""".splitlines()
special = {
    "mess up": ["mess up", ":tense :present :mood :indicative"],
    "sang": ["sing", ":tense :present :mood :indicative"],
}
have_dict = {
    "had": [4, ":tense :past"],
    "have": [5, ":tense :present"],
}
def ok(w, flags):
    l = []
    if w in intransitives:
        l.append(':valency :intransitive')
    if w in ditransitives:
        l.append(':valency :ditransitive')
    if w in transitives:
        l.append(':valency :transitive')
    return ["{parsenode ((type . verb) (is %s) (flags %s %s) (descs) (other) (remsen))}" % (w, i, flags) for i in l]
def past(w):
    ret = []
    if w.endswith('ed'):
        ret += ok(w[:-1], ":tense :past :mood :indicative")
        ret += ok(w[:-1], ":tense :past :mood :participle")
        ret += ok(w[:-2], ":tense :past :mood :indicative")
        ret += ok(w[:-2], ":tense :past :mood :participle")
        if w.endswith('ied'):
            ret += ok(w[:-3]+'y', ":tense :past :mood :indicative")
            ret += ok(w[:-3]+'y', ":tense :past :mood :participle")
        if len(w) >= 4 and w[-3] == w[-4]:
            ret += ok(w[:-3], ":tense :past :mood :indicative")
            ret += ok(w[:-3], ":tense :past :mood :participle")
    return ret
def perfect(w):
    ret = []
    for k in have_dict.keys():
        l = have_dict[k]
        sl = past(w[l[0]:])
        for s in sl:
            w = s.split(')')[1].split('is ')[-1]
            ret += ok(w, ":aspect :perfect " + l[1])
    return ret
def tolisp(word):
    w = word.lower()
    ret = []
    ret += ok(w, ":tense :present :mood :indicative")
    ret += ok(w, ":tense :present :mood :imperative")
    ret += past(w)
    ret += perfect(w)
    if w.endswith('s'):
        ret += ok(w[:-1], ":tense :present :mood :indicative :person 3 :number :single")
        if w.endswith('ies'):
            ret += ok(w[:-3] + 'y', ":tense :present :mood :indicative :person 3 :number :single")
    if w.startswith('to '):
        ret += ok(w[3:], ":tense nil :mood :infinitive")
    if w.startswith('will '):
        ret += ok(w[5:], ":tense :future :mood :indicative")
    if w.startswith('it '):
        for i in tolisp(w[3:]):
            if ':valency :intransitive' in i:
                ret.append(i.replace(':valency :intransitive', ':valency :impersonal'))
            elif ':valency :transitive' in i:
                ret.append(i.replace(':valency :transitive', ':valency :impersonal'))
            elif ':valency :ditransitive' in i:
                ret.append(i.replace(':valency :ditransitive', ':valency :impersonal'))
    try:
        l = special[w]
        ret.append("{parsenode ((type . verb) (is %s) (flags %s) (descs) (other) (remsen))}" % l[0], l[1])
    except:
        pass
    if w.endswith('ly') and tolisp(w[:-2]):
        ret.append("{parsenode ((type . adverb) (is %s) (flags) (descs) (other) (remsen))}" % w)
    if w.endswith('ing'):
        if tolisp(w[:-3]):
            x = w[:-3]
        elif tolisp(w[:-3] + 'e'):
            x = w[:-3] + 'e'
        elif len(w) >= 5 and w[-4] == w[-5] and tolisp(w[:-4]):
            x = w[:-4]
        if x:
            ret.append("{parsenode ((type . verb) (is %s) (flags :tense :present :mood :participle) (descs) (other) (remsen))}" % x)
    return ret
