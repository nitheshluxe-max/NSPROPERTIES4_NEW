<?php
if(PHP_SAPI!=='cli'){http_response_code(404);exit;}
require dirname(__DIR__).'/api/bootstrap.php';
if($argc!==3||strlen($argv[2])<12){fwrite(STDERR,"Usage: php admin/create-admin.php username strong-password\n");exit(1);}
$s=db()->prepare('INSERT INTO admin_users (username,password_hash) VALUES (?,?) ON DUPLICATE KEY UPDATE password_hash=VALUES(password_hash)');
$s->execute([$argv[1],password_hash($argv[2],PASSWORD_DEFAULT)]);
echo "Admin created/updated.\n";
