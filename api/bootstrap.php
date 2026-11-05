<?php
declare(strict_types=1);
header('X-Content-Type-Options: nosniff');
if(session_status()!==PHP_SESSION_ACTIVE){
 session_set_cookie_params(['httponly'=>true,'secure'=>!empty($_SERVER['HTTPS'])&&$_SERVER['HTTPS']!=='off','samesite'=>'Lax','path'=>'/']);
 session_start();
}
function db():PDO{
 static $db=null;
 if($db===null)$db=new PDO(getenv('NS_DB_DSN')?:'mysql:host=127.0.0.1;dbname=nsproperties;charset=utf8mb4',getenv('NS_DB_USER')?:'root',getenv('NS_DB_PASSWORD')?:'',[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC,PDO::ATTR_EMULATE_PREPARES=>false]);
 return $db;
}
function reply(array $payload,int $status=200):never{http_response_code($status);header('Content-Type: application/json; charset=utf-8');echo json_encode($payload,JSON_INVALID_UTF8_SUBSTITUTE);exit;}
function method(string $expected):void{if($_SERVER['REQUEST_METHOD']!==$expected){header('Allow: '.$expected);reply(['error'=>'Method not allowed'],405);}}
function body():array{$raw=file_get_contents('php://input',false,null,0,1048577);if(strlen($raw)>1048576)reply(['error'=>'Payload too large'],413);$v=json_decode($raw,true);if(!is_array($v))reply(['error'=>'Expected JSON'],400);return $v;}
function token():string{return $_SESSION['csrf']??=bin2hex(random_bytes(32));}
function csrf():void{
 if(!hash_equals(token(),$_SERVER['HTTP_X_CSRF_TOKEN']??''))reply(['error'=>'Invalid CSRF token'],403);
 $origin=$_SERVER['HTTP_ORIGIN']??'';
 if($origin&&parse_url($origin,PHP_URL_HOST)!==explode(':',$_SERVER['HTTP_HOST']??'')[0])reply(['error'=>'Invalid origin'],403);
}
function admin():void{if(empty($_SESSION['admin_id']))reply(['error'=>'Authentication required'],401);}
function field(mixed $v,int $limit=250):string{
 if(!is_scalar($v)&&$v!==null)reply(['error'=>'Invalid field'],422);
 $s=trim((string)($v??''));if(mb_strlen($s)>$limit)reply(['error'=>'Field too long'],422);return $s;
}
function amount(mixed $v):float{if(!is_numeric($v)||!is_finite((float)$v)||(float)$v<=0)reply(['error'=>'Invalid amount'],422);return (float)$v;}
