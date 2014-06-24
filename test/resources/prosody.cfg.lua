modules_enabled = {
  "disco";
  "register";
};

component_ports = { 8888 }
c2s_ports       = { 8889 }

VirtualHost "localhost"
  enabled = true
  allow_registration = true
 
Component "component.localhost"
  component_secret = "mysecretcomponentpassword"
