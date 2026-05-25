import os
import shutil

source_dir = 'src/pages/admin'
target_dir = 'src/pages/agent'

if not os.path.exists(target_dir):
    os.makedirs(target_dir)

files_to_copy = {
    'AdminPropertiesList.tsx': 'AgentPropertiesList.tsx',
    'AdminPropertyForm.tsx': 'AgentPropertyForm.tsx',
    'AdminInvoices.tsx': 'AgentInvoices.tsx',
    'AdminInvoiceForm.tsx': 'AgentInvoiceForm.tsx',
    'AdminTenantsList.tsx': 'AgentTenantsList.tsx',
    'AdminTenantForm.tsx': 'AgentTenantForm.tsx',
    'AdminTenantDetail.tsx': 'AgentTenantDetail.tsx',
    'AdminContractsList.tsx': 'AgentContractsList.tsx',
    'AdminContractForm.tsx': 'AgentContractForm.tsx',
    'AdminLeadsCRM.tsx': 'AgentLeadsCRM.tsx',
    'AdminReservations.tsx': 'AgentReservations.tsx',
    'AdminPropertyReorder.tsx': 'AgentPropertyReorder.tsx',
}

replacements = [
    ('AdminPropertiesList', 'AgentPropertiesList'),
    ('AdminPropertyForm', 'AgentPropertyForm'),
    ('AdminInvoices', 'AgentInvoices'),
    ('AdminInvoiceForm', 'AgentInvoiceForm'),
    ('AdminTenantsList', 'AgentTenantsList'),
    ('AdminTenantForm', 'AgentTenantForm'),
    ('AdminTenantDetail', 'AgentTenantDetail'),
    ('AdminContractsList', 'AgentContractsList'),
    ('AdminContractForm', 'AgentContractForm'),
    ('AdminLeadsCRM', 'AgentLeadsCRM'),
    ('AdminReservations', 'AgentReservations'),
    ('AdminPropertyReorder', 'AgentPropertyReorder'),
    ('AdminDashboard', 'AgentDashboard'),
    ('AdminLayout', 'AgentLayout'),
    ('"/admin/', '"/agente/'),
    ('\'/admin/', '\'/agente/'),
    ('`/admin/', '`/agente/'),
    ('"/admin"', '"/agente"'),
    ('\'/admin\'', '\'/agente\''),
    ('`/admin`', '`/agente`'),
]

for src_name, tgt_name in files_to_copy.items():
    src_path = os.path.join(source_dir, src_name)
    tgt_path = os.path.join(target_dir, tgt_name)
    
    if os.path.exists(src_path):
        print(f"Replicating {src_path} -> {tgt_path}")
        with open(src_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        for old, new in replacements:
            content = content.replace(old, new)
            
        with open(tgt_path, 'w', encoding='utf-8') as f:
            f.write(content)
    else:
        print(f"Warning: {src_path} not found")

print("Replication completed.")
