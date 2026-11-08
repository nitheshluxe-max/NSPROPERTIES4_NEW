<?php
require __DIR__.'/bootstrap.php';method('POST');csrf();$d=body();
$id=filter_var($d['propertyId']??null,FILTER_VALIDATE_INT);
$name=field($d['name']??'',120);$phone=field($d['phone']??'',10);$email=field($d['email']??'',254);
$type=field($d['type']??'Property Enquiry',60);$message=field($d['message']??'',2000);
if(!$id||!$name||!preg_match('/^[0-9]{10}$/D',$phone)||($email&&!filter_var($email,FILTER_VALIDATE_EMAIL)))reply(['error'=>'Invalid enquiry'],422);
try{
 $check=db()->prepare("SELECT id FROM properties WHERE id=? AND status='approved'");$check->execute([$id]);if(!$check->fetch())reply(['error'=>'Property not found'],404);
 $s=db()->prepare('INSERT INTO enquiries (property_id,name,phone,email,enquiry_type,message) VALUES (?,?,?,?,?,?)');
 $s->execute([$id,$name,$phone,$email?:null,$type,$message]);reply(['success'=>true,'message'=>'Enquiry saved'],201);
}catch(PDOException $e){error_log($e->getMessage());reply(['error'=>'Database unavailable'],503);}
