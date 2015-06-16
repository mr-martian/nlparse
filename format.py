f = open('new_test_formatted.txt', 'r')
lst = []
l = f.readline().split()
while l:
    lst = list(set(lst + [x.lower() for x in l]))
    l = f.readline().split()
f.close()
lst.sort()
w = open('new_test_wordlist.txt', 'w')
w.write('\n'.join(lst))
w.close()
