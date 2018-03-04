### Notes on Static sites on AWS

* Create s3 bucket with domain name. IE site.com
* Configure s3 bucket

Enable static hosting (Angular requires redirect this is a requirement.)

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::site.com/*"
        }
    ]
}
```


Add policy for reading from site.com

```xml
<RoutingRules>
  <RoutingRule>
    <Condition>
      <HttpErrorCodeReturnedEquals>404</HttpErrorCodeReturnedEquals>
    </Condition>
    <Redirect>
      <Protocol>https</Protocol>
      <HostName>site.com</HostName>
      <ReplaceKeyPrefixWith>#/</ReplaceKeyPrefixWith>
    </Redirect>
  </RoutingRule>
</RoutingRules>
```

* Configure cloudfront distribution

Point the cloudfront at the static webiste hosting url NOT the s3 bucket. (Redirects required)

```text
http://site.com.s3-website-us-west-2.amazonaws.com
```

Name the origin with Webiste in name to make it clear.

```text
S3-Webiste-site.com
```

Add Cname

```text
site.com
```

* Configure Route 53

Point the domain at the cloudfront distribution by choosing A Name -> Alias -> CloudFront and select the site.com option.