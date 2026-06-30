### Table Creation

Ran directly in supabase:

```
create table public.salesforce_data (
  id           bigserial primary key,
  company_id   varchar(50)    not null,
  company_name text   not null,
  year         int    not null,
  sales        numeric not null,
  profit       numeric not null
  );
```

And the entries:

```
insert into public.salesforce_data (company_id, company_name, year, sales, profit) values
('BC_1','Blue Cheese Inc',2021,1000,150),
('BC_1','Blue Cheese Inc',2022,1150,170),
('BC_1','Blue Cheese Inc',2023,1250,180),

('QP_2','Quantum Pets',2021,920,60),
('QP_2','Quantum Pets',2022,900,40),
('QP_2','Quantum Pets',2023,890,25),

('EF_3','EcoFriendship Ltd',2021,1400,50),
('EF_3','EcoFriendship Ltd',2022,1520,-30),
('EF_3','EcoFriendship Ltd',2023,1550,-20),

('NR_4','Neon Robotics',2021,500,-100),
('NR_4','Neon Robotics',2022,750,-50),
('NR_4','Neon Robotics',2023,1200,20),

('SSE_5','SolarSphere Energy',2021,800,70),
('SSE_5','SolarSphere Energy',2022,810,75),
('SSE_5','SolarSphere Energy',2023,820,80),

('BBF_6','ByteBites Foods',2021,1200,250),
('BBF_6','ByteBites Foods',2022,1100,150),
('BBF_6','ByteBites Foods',2023,950,-20),

('ACS_7','AeroCloud Systems',2021,300,-50),
('ACS_7','AeroCloud Systems',2022,450,-10),
('ACS_7','AeroCloud Systems',2023,600,40),

('CWAR_8','CrystalWear AR',2021,700,100),
('CWAR_8','CrystalWear AR',2022,650,20),
('CWAR_8','CrystalWear AR',2023,600,-40),

('HAIL_9','Harbor AI Logistics',2021,2000,250),
('HAIL_9','Harbor AI Logistics',2022,2400,350),
('HAIL_9','Harbor AI Logistics',2023,2800,500),

('VRM_10','VelvetRide Mobility',2021,1000,100),
('VRM_10','VelvetRide Mobility',2022,980,80),
('VRM_10','VelvetRide Mobility',2023,970,75);
```
