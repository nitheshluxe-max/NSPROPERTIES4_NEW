<?php
require __DIR__.'/bootstrap.php';method('POST');csrf();$d=body();
$types=['Sell'=>'buy','Rent'=>'rent','Lease'=>'rent'];$listing=field($d['listingType']??'',20);
if(!isset($types[$listing]))reply(['error'=>'Invalid listing type'],422);
$title=field($d['title']??'',120);$category=field($d['propertyType']??'',80);$locality=field($d['locality']??'',120);
$city=field($d['city']??'',120);$address=field($d['address']??'',500);$state=field($d['state']??'',100);
$pin=field($d['pincode']??'',6);$name=field($d['contactName']??'',120);$phone=field($d['contactPhone']??'',10);
$email=field($d['contactEmail']??'',254);$description=field($d['description']??'',2000);
$availability=field($d['availability']??'Ready to Move',80);
if(!$title||!$category||!$locality||!$city||!$address||!$state||!$name||!$description||!preg_match('/^[0-9]{6}$/D',$pin)||!preg_match('/^[0-9]{10}$/D',$phone)||!filter_var($email,FILTER_VALIDATE_EMAIL))reply(['error'=>'Check required fields'],422);
$bhk=(int)($d['bhk']??0);$bath=(int)($d['bathrooms']??0);
if($bhk<0||$bhk>20||$bath<0||$bath>40)reply(['error'=>'Invalid room counts'],422);
$amenities=$d['amenities']??[];if(!is_array($amenities)||count($amenities)>40||count(array_filter($amenities,fn($s)=>!is_string($s)||mb_strlen($s)>80)))reply(['error'=>'Invalid amenities'],422);
try{
 $s=db()->prepare('INSERT INTO properties (title,listing_type,category,locality,city,address,state,pincode,price,area,bhk,bathrooms,availability,description,amenities,image_urls,contact_name,contact_phone,contact_email) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)');
 $s->execute([$title,$types[$listing],$category,$locality,$city,$address,$state,$pin,amount($d['price']??null),amount($d['area']??null),$bhk,$bath,$availability,$description,json_encode($amenities),json_encode([]),$name,$phone,$email]);
 reply(['success'=>true,'reference'=>'NSP-'.db()->lastInsertId(),'message'=>'Submitted for review; photos are not uploaded in this version.'],201);
}catch(PDOException $e){error_log($e->getMessage());reply(['error'=>'Database unavailable'],503);}
