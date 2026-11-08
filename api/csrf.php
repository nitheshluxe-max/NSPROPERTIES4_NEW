<?php
require __DIR__.'/bootstrap.php';method('GET');reply(['token'=>token(),'authenticated'=>!empty($_SESSION['admin_id'])]);
