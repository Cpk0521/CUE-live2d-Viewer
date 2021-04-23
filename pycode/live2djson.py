import json
import os

class Costume:

    def __init__(self, no, heroineId, costumeId, costumeName):
        self.no = no
        self.heroineId = heroineId
        self.costumeId = costumeId
        self.costumeName = costumeName
    
    def outtext(self):
        return "%s, %s, %s, %s" % (self.no, self.heroineId, self.costumeId, self.costumeName)

    def outtext2(self):
        return "%02d_%03d, %s" % (self.heroineId, self.costumeId, self.costumeName)

# ----------------

costlist = []

with open('HeroineCostumeMaster.json', 'r', encoding='utf-8') as json_file:
    data = json.load(json_file)
    for c in data['<ModelList>k__BackingField']:
        costlist.append(Costume(c['id'], c['heroineId'], c['costumeId'], c['costumeName']))

costlist.sort(key = lambda x:(x.heroineId, x.costumeId), reverse = False)

# ----------------

chars = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 11, 12, 13, 14, 15, 16, 101, 102, 103]

jsondata = {}

for char in chars:
    chartilte = '%02d' % (char)
    tiltename = '%03d' % (char)
    jsondata.update({tiltename:[]})
    for model in range(1,20):
        filename = 'live2d/%s/%03d/%03d.model3.json' % (chartilte, model, char)
        if os.path.exists('../' + filename):
            c = list(filter(lambda x: (x.heroineId == char and x.costumeId == model), costlist))
            if c:
                jsondata[tiltename].append({ 'costumeId':model, 'name':c[0].costumeName , 'path':filename})
            else:
                jsondata[tiltename].append({ 'costumeId':model, 'name':"不明" , 'path':filename})
                

with open('live2dList.json', 'w', encoding='utf-8') as outfile:
    json.dump(jsondata, outfile, indent=4, ensure_ascii=False)
