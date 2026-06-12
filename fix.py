with open('api/get-county-data.ts', 'r', encoding='utf-8') as f:
    c = f.read()

c = c.replace('responseMimeType: "application/json",', 'systemInstruction: "You are an expert in US local politics and geography. It is currently the year 2026. Provide the MOST RECENT and CURRENT political figures (Governors, Senators, etc.) serving as of 2026.",\n                    responseMimeType: "application/json",')

with open('api/get-county-data.ts', 'w', encoding='utf-8') as f:
    f.write(c)
