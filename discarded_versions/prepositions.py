preps = """about
above
according to
across
after
against
along
along with
among
apart from
around
as
as for
at
because of
before
behind
below
beneath
beside
between
beyond
but
by
by means of
concerning
despite
down
during
except
except for
excepting
for
from
in
in addition to
in back of
in case of
in front of
in place of
inside
in spite of
instead of
into
like
near
next
of
off
on
onto
on top of
out
out of
outside
over
past
regarding
round
since
through
throughout
till
to
toward
under
underneath
unlike
until
up
upon
up to
with
within
without""".splitlines()
def tolisp(word):
    if word in preps:
        return "{parsenode ((type . prep) (is %s) (flags) (descs) (other) (remsen))}" % word
    else:
        return False
