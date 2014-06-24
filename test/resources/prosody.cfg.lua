modules_enabled = {
  "disco"; -- Service discovery
};

component_ports = { 8888 }
c2s_ports       = { 8889 }

VirtualHost "localhost"
  enabled = true
 
Component "conference.localhost"
  component_secret = "mysecretcomponentpassword"
