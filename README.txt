This document gives instructions for running this application.

Prerequisites:
Docker must be installed on the computer on which this application is run.

Starting the application:
From a command line,
* Navigate to the "docker" directory
* Run the command "docker-compose up"

Using the application:
* Open the file "index.html" in a browser
* Enter latitude and longitude values and press the "Send" buttons

Viewing the number of API calls made:
From a command line,
* Run the command "docker ps"
* Find the container ID of the image named "mysql-server" and copy it
* Run this command to enter the container (replacing '<mysql-container-id>'
  with the copied value): "docker exec -it <mysql-container-id> bash"
* You should now have a bash prompt in the "mysql-server" container
* Start the mysql client with the command "mysql -uroot -pmichael"
* You should now have a "mysql>" prompt
* Enter "use bcapp;"
* You should see output including the line "Database changed"
* Enter "select num_calls from api_calls;"
* The number of calls is output
