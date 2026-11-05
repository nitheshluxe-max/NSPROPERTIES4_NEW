<?php
require __DIR__.'/bootstrap.php';
$action=$_GET['action']??'';
if($action==='login'){
 method('POST');csrf();$d=body();$name=field($d['username']??'',80);$pw=(string)($d['password']??'');
 if(strlen($pw)>1024)reply(['error'=>'Invalid credentials'],401);
 try{$s=db()->prepare('SELECT id,password_hash FROM admin_users WHERE username=?');$s->execute([$name]);$u=$s->fetch();
 if(!$u||!password_verify($pw,$u['password_hash'])){usleep(200000);reply(['error'=>'Invalid credentials'],401);}
 session_regenerate_id(true);$_SESSION['admin_id']=$u['id'];reply(['success'=>true,'token'=>token()]);
 }catch(PDOException $e){error_log($e->getMessage());reply(['error'=>'Database unavailable'],503);}
}
if($action==='logout'){method('POST');csrf();$_SESSION=[];session_destroy();reply(['success'=>true]);}
admin();
try{
 if($action==='dashboard'){method('GET');
 $counts=db()->query('SELECT status,COUNT(*) total FROM properties GROUP BY status')->fetchAll();
 $properties=db()->query('SELECT id,title,locality,city,price,status,created_at FROM properties ORDER BY created_at DESC LIMIT 100')->fetchAll();
 $enquiries=db()->query('SELECT e.id,e.name,e.phone,e.email,e.enquiry_type,e.message,e.created_at,p.title property_title FROM enquiries e JOIN properties p ON p.id=e.property_id ORDER BY e.created_at DESC LIMIT 100')->fetchAll();
 reply(compact('counts','properties','enquiries'));
 }
 if($action==='review'){method('POST');csrf();$d=body();$id=filter_var($d['id']??null,FILTER_VALIDATE_INT);$status=$d['status']??'';
 if(!$id||!in_array($status,['pending','approved','rejected'],true))reply(['error'=>'Invalid review'],422);
 $s=db()->prepare("UPDATE properties SET status=?,approved_at=IF(?='approved',NOW(),NULL) WHERE id=?");
 $s->execute([$status,$status,$id]);reply(['success'=>true]);}
 reply(['error'=>'Unknown action'],404);
}catch(PDOException $e){error_log($e->getMessage());reply(['error'=>'Database unavailable'],503);}
