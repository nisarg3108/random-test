import re

# Read mermaid file
with open('UEORMS_FULL_ER_DIAGRAM_CHEN_STYLE.mmd', 'r', encoding='utf-8') as f:
    content = f.read()

# Parse entities and attributes
entities = {}
relationships = {}
current_entity = None

for line in content.split('\n'):
    line = line.strip()
    
    # Entity
    if line.startswith('E_') and '["' in line and '"]:::entity' in line:
        match = re.match(r'E_(\w+)\["(.+?)"\]:::entity', line)
        if match:
            entity_id = match.group(1)
            entity_name = match.group(2)
            entities[entity_id] = {'name': entity_name, 'attributes': []}
            current_entity = entity_id
    
    # Attribute
    elif line.startswith('A_') and '(["' in line and '"]):::' in line:
        match = re.match(r'A_\w+_(\w+)\(\["(.+?)"\]\):::(key|attr)', line)
        if match and current_entity:
            attr_name = match.group(2)
            attr_type = match.group(3)
            entities[current_entity]['attributes'].append({
                'name': attr_name,
                'is_key': attr_type == 'key'
            })
    
    # Relationship
    elif line.startswith('R_') and '{"' in line and '"}:::rel' in line:
        match = re.match(r'R_(\d+)\{"(.+?)"\}:::rel', line)
        if match:
            rel_id = match.group(1)
            rel_name = match.group(2)
            relationships[rel_id] = {'name': rel_name, 'from': None, 'to': None, 'card_from': None, 'card_to': None}
    
    # Relationship connections (TWO lines per relationship)
    elif '---|' in line and 'R_' in line:
        # Match: E_Entity ---|cardinality| R_001 OR R_001 ---|cardinality| E_Entity
        match1 = re.match(r'E_(\w+)\s*---\|(.+?)\|\s*R_(\d+)', line)
        match2 = re.match(r'R_(\d+)\s*---\|(.+?)\|\s*E_(\w+)', line)
        
        if match1:
            entity = match1.group(1)
            cardinality = match1.group(2)
            rel_id = match1.group(3)
            if rel_id in relationships and entity in entities:
                if relationships[rel_id]['from'] is None:
                    relationships[rel_id]['from'] = entity
                    relationships[rel_id]['card_from'] = cardinality
        elif match2:
            rel_id = match2.group(1)
            cardinality = match2.group(2)
            entity = match2.group(3)
            if rel_id in relationships and entity in entities:
                relationships[rel_id]['to'] = entity
                relationships[rel_id]['card_to'] = cardinality

# Generate Draw.io XML
xml = '''<?xml version="1.0" encoding="UTF-8"?>
<mxfile host="app.diagrams.net" modified="2024-01-01T00:00:00.000Z" agent="5.0" version="22.1.0" etag="drawio-diagram" type="device">
  <diagram name="ERP System ER Diagram - Chen Style" id="er-diagram">
    <mxGraphModel dx="2000" dy="1200" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="30000" pageHeight="20000" math="0" shadow="0">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />
'''

# Layout configuration - Extreme spacing to prevent all overlap
x_start, y_start = 500, 500
x_spacing, y_spacing = 2000, 1500
cols = 3
entity_width, entity_height = 180, 90
attr_width, attr_height = 120, 40

# Generate entities and attributes
entity_list = list(entities.keys())
entity_positions = {}

for idx, entity_id in enumerate(entity_list):
    entity = entities[entity_id]
    row = idx // cols
    col = idx % cols
    x = x_start + col * x_spacing
    y = y_start + row * y_spacing
    entity_positions[entity_id] = (x, y)
    
    # Entity box
    xml += f'''        <mxCell id="E_{entity_id}" value="{entity['name']}" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;strokeWidth=2.5;fontColor=#000000;fontSize=14;fontStyle=1;" vertex="1" parent="1">
          <mxGeometry x="{x}" y="{y}" width="{entity_width}" height="{entity_height}" as="geometry" />
        </mxCell>
'''
    
    # Attributes - extreme spacing to avoid overlap
    num_attrs = len(entity['attributes'])
    attrs_per_side = 25
    
    for attr_idx, attr in enumerate(entity['attributes']):
        if attr_idx < attrs_per_side:
            attr_x = x - 180
            attr_y = y - 150 + (attr_idx % attrs_per_side) * 50
        else:
            attr_x = x + entity_width + 60
            attr_y = y - 150 + ((attr_idx - attrs_per_side) % attrs_per_side) * 50
        
        stroke_width = '2' if attr['is_key'] else '1'
        
        xml += f'''        <mxCell id="A_{entity_id}_{attr_idx}" value="{attr['name']}" style="ellipse;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#{'111111' if attr['is_key'] else '555555'};strokeWidth={stroke_width};fontColor=#111111;fontSize=11;" vertex="1" parent="1">
          <mxGeometry x="{attr_x}" y="{attr_y}" width="{attr_width}" height="{attr_height}" as="geometry" />
        </mxCell>
        <mxCell id="L_{entity_id}_{attr_idx}" value="" style="endArrow=none;html=1;strokeWidth=1.5;strokeColor=#666666;" edge="1" parent="1" source="A_{entity_id}_{attr_idx}" target="E_{entity_id}">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
'''

# Generate relationships
rel_count = 0
for rel_id, rel in relationships.items():
    if rel['from'] and rel['to'] and rel['from'] in entity_positions and rel['to'] in entity_positions:
        rel_count += 1
        from_x, from_y = entity_positions[rel['from']]
        to_x, to_y = entity_positions[rel['to']]
        
        from_cx = from_x + entity_width // 2
        from_cy = from_y + entity_height // 2
        to_cx = to_x + entity_width // 2
        to_cy = to_y + entity_height // 2
        
        rel_x = (from_cx + to_cx) // 2 - 60
        rel_y = (from_cy + to_cy) // 2 - 50
        
        xml += f'''        <mxCell id="R_{rel_id}" value="{rel['name']}" style="rhombus;whiteSpace=wrap;html=1;fillColor=#fff2cc;strokeColor=#d6b656;strokeWidth=3;fontColor=#000000;fontSize=11;fontStyle=1;" vertex="1" parent="1">
          <mxGeometry x="{rel_x}" y="{rel_y}" width="120" height="100" as="geometry" />
        </mxCell>
        <mxCell id="L_R_{rel_id}_from" value="{rel['card_from']}" style="endArrow=none;html=1;strokeWidth=3;strokeColor=#000000;fontSize=13;fontColor=#000000;labelBackgroundColor=#ffffff;fontStyle=1;" edge="1" parent="1" source="E_{rel['from']}" target="R_{rel_id}">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="L_R_{rel_id}_to" value="{rel['card_to']}" style="endArrow=none;html=1;strokeWidth=3;strokeColor=#000000;fontSize=13;fontColor=#000000;labelBackgroundColor=#ffffff;fontStyle=1;" edge="1" parent="1" source="R_{rel_id}" target="E_{rel['to']}">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
'''

# Add legend
xml += '''        <mxCell id="legend_bg" value="" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#f5f5f5;strokeColor=#666666;" vertex="1" parent="1">
          <mxGeometry x="100" y="30" width="700" height="40" as="geometry" />
        </mxCell>
        <mxCell id="legend_text" value="ERP System - Complete ER Diagram (Chen Notation) - ALL Entities, ALL Attributes, ALL Relationships" style="text;html=1;strokeColor=none;fillColor=none;align=center;verticalAlign=middle;whiteSpace=wrap;rounded=0;fontStyle=1;fontSize=14;" vertex="1" parent="1">
          <mxGeometry x="100" y="30" width="700" height="40" as="geometry" />
        </mxCell>
'''

xml += '''      </root>
    </mxGraphModel>
  </diagram>
</mxfile>'''

# Write to file
with open('UEORMS_FULL_ER_DIAGRAM_CHEN_STYLE.drawio', 'w', encoding='utf-8') as f:
    f.write(xml)

print(f"Generated Draw.io file with {len(entities)} entities")
print(f"Total attributes: {sum(len(e['attributes']) for e in entities.values())}")
print(f"Total relationships parsed: {len(relationships)}")
print(f"Total relationships rendered: {rel_count}")
print(f"\nFile: UEORMS_FULL_ER_DIAGRAM_CHEN_STYLE.drawio")
