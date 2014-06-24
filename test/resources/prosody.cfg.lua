modules_enabled = {
  "disco"; -- Service discovery
};
 
VirtualHost "localhost"
  enabled = true
 
Component "conference.localhost"
  component_secret = "mysecretcomponentpassword"
